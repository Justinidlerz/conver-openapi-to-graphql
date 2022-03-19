const fs = require('fs');
const glob = require('glob');
const { translateOpenAPIToGraphQL } = require('openapi-to-graphql');
const { Resolver } = require('@stoplight/json-ref-resolver');
const DEFAULT_OPTIONS = require('./defaultOptions');
const { mapValuesDeep } = require('./map');

const resolver = new Resolver({
  resolvers: {
    file: {
      resolve(ref) {
        const filePath = String(ref);
        let fileContent;
        try {
          const originFileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
          fileContent = JSON.parse(originFileContent);
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

const readFile = async (filePath) => {
  const file = fs.readFileSync(filePath, { encoding: 'utf8' });
  const sourceData = JSON.parse(file);

  const parsedSchema = await resolver.resolve(sourceData, {
    baseUri: filePath,
  });

  return mapValuesDeep(parsedSchema.result, (value, parentKey) => {
    if (parentKey === 'parameters' && Array.isArray(value)) {
      return value.filter((value) => value.name !== 'am-api-key');
    }
    return value;
  });
};

const loadSchema = async (apiDocsPathRules) => {
  const oass = await Promise.all(glob.sync(apiDocsPathRules).map((file) => readFile(file)));
  const { schema } = await translateOpenAPIToGraphQL(oass, {
    ...DEFAULT_OPTIONS,
    fillEmptyResponses: true,
  });

  return schema;
};

module.exports = {
  loadSchema,
};
