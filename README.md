# Cover openapi to graphql

# Usage

```shell
npm install osa2gql -g

osa2gql <docs-file-patterns> [outputPath]
```

For more docs-file-patterns, please see the glob-primer of [node-glob](https://github.com/isaacs/node-glob#glob-primer)

Please wrap the docs-file-patterns in quotation marks for prevent your command-line tool decode it

**Note: Please only select the open-api main doc, `$ref` files will auto resoled by tool** 

# Example
```shell
// This will output content in console
osa2gql '/doc-path/*/*.json'

// This will write content into the file
osa2gql '/doc-path/*/*.json' ./output.graphql
```

# License

To a detailed explanation on how things work, checkout the [openapi-to-graphql](https://github.com/ibm/openapi-to-graphql) doc and [node-glob](https://github.com/isaacs/node-glob)

MIT license, Copyright (c) 2022-present, Idler.zhu
