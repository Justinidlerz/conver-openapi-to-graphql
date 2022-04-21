const fs = require('fs');
const glob = require('glob');
const path = require('path');
const {omit} = require('lodash');
const { translateOpenAPIToGraphQL } = require('openapi-to-graphql');
const { convertObj: ConvertSwagger2openapi } = require('swagger2openapi');
const { Resolver } = require('@stoplight/json-ref-resolver');
const { load: yamlLoader } = require('js-yaml');
const DEFAULT_OPTIONS = require('./defaultOptions');
const { mapValuesDeep } = require('./map');

const createResolver = () => {
  return new Resolver({
    resolvers: {
      file: {
        resolve(ref) {
          const filePath = String(ref);
          const { ext, name } = path.parse(filePath);
          let fileContent;
          try {
            const originFileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
            switch (ext) {
              case '.json':
                fileContent = JSON.parse(originFileContent);
                break;
              case '.yaml':
                fileContent = yamlLoader(originFileContent);
                break;
              default:
                throw new Error('Can not resolve file');
            }
            if ('title' in fileContent) {
              // Delete title for prevent generated some wrong type name
              delete fileContent.title;
            }
          } catch (e) {
            fileContent = {
              type: 'object',
            };
          }
          return fileContent;
        },
      },
    },
  });
};

const httpMethodsNamedPrefixMap = {
  get: '',
  post: 'create-',
  put: 'create-or-update-',
  patch: 'update-',
  delete: 'delete-',
};

const readFile = async (resolver, filePath) => {
  const file = fs.readFileSync(filePath, { encoding: 'utf8' });
  const fileExt = path.parse(filePath).ext;

  let sourceData;
  switch (fileExt) {
    case '.json':
      sourceData = JSON.parse(file);
      break;
    case '.yaml':
      sourceData = yamlLoader(file);
      break;
    default:
      throw new Error(`File unsupported: ${filePath}`);
  }
  if (!sourceData.info) {
    return null;
  }
  const parsedSchema = await resolver.resolve(sourceData, {
    baseUri: filePath,
  });

  let schema = parsedSchema.result;
  if (schema.swagger) {
    try {
      // Transform swagger to openapi
      const { openapi } = await ConvertSwagger2openapi(schema, {
        anchors: true,
      });
      schema = openapi;
    } catch (e) {
      return null;
    }
  }

  return mapValuesDeep(schema, (value, parentKey) => {
    if (parentKey === 'parameters' && Array.isArray(value)) {
      return value.filter((value) => value.name !== 'am-api-key');
    }

    // Format operationId
    if (parentKey === 'paths') {
      const newPaths = Object.entries(value).map(([path, methodDefs]) => {
        // Replace all the / to -
        // Remove all variable params in path
        const transformedPath = path
            .replace(/\//g, '-')
            .replace(/({[^}]+}\/?)/g, '')
            .replace(/-(private|public|admin|internal|add|delete|get|remove|update)/g, '');

        const newDefs = Object.entries(methodDefs).map(([method, def]) => {
          if (httpMethodsNamedPrefixMap[method] === undefined) {
            return [method, def];
          }
          const returnsDef = {
            ...omit(def, ['security']),
            operationId: `${httpMethodsNamedPrefixMap[method]}${transformedPath}`,
          };
          return [method, returnsDef];
        });

        return [path, Object.fromEntries(newDefs)];
      });

      return Object.fromEntries(newPaths);
    }

    // Transform all 20x status code responses to remove the response wrapper
    if (parentKey === 'responses') {
      const newResponses = Object.entries(value).map(([code, response]) => {
        if (!code.startsWith('20')) {
          return [code, response];
        }

        if (response?.content?.['application/json']?.schema?.properties?.data) {
          const isDirectlyReturnArray =
              response.content['application/json'].schema.properties.data.type === 'array';
          const originalResponseData = response.content['application/json'].schema.properties.data;

          const newResponseBody = {
            type: 'object',
            properties: {},
          };

          if (isDirectlyReturnArray) {
            Object.assign(newResponseBody.properties, {
              list: originalResponseData,
            });
          } else {
            Object.assign(newResponseBody, { ...originalResponseData });
          }

          if (
              response.content['application/json'].schema.properties.pagination &&
              !('pagination' in response.content['application/json'].schema.properties.data)
          ) {
            // Merge pagination to data
            newResponseBody.properties.pagination =
                response.content['application/json'].schema.properties.pagination;
          }
          const reducedResponse = {
            ...response,
            content: {
              ...response.content,
              'application/json': {
                ...response.content['application/json'],
                schema: newResponseBody,
              },
            },
          };

          return [code, reducedResponse];
        }
        return [code, response];
      });

      return Object.fromEntries(newResponses);
    }

    return value;
  });
};

const loadSchema = async (apiDocsPathRules) => {
  const resolver = createResolver();
  const oass = await Promise.all(glob.sync(apiDocsPathRules).map((file) => readFile(resolver, file)));
  const { schema } = await translateOpenAPIToGraphQL(oass.filter(Boolean), {
    ...DEFAULT_OPTIONS,
    fillEmptyResponses: true,
  });

  return schema;
};

module.exports = {
  loadSchema,
};
