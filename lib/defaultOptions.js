
const DEFAULT_OPTIONS = {
  report: {
    warnings: [],
    numOps: 0,
    numOpsQuery: 0,
    numOpsMutation: 0,
    numOpsSubscription: 0,
    numQueriesCreated: 0,
    numMutationsCreated: 0,
    numSubscriptionsCreated: 0,
  },
  // Setting default options
  strict: false,
  // Schema options
  operationIdFieldNames: false,
  fillEmptyResponses: false,
  addLimitArgument: false,
  idFormats: [],
  selectQueryOrMutationField: {},
  genericPayloadArgName: false,
  simpleNames: false,
  simpleEnumValues: false,
  singularNames: false,
  createSubscriptionsFromCallbacks: false,
  // Resolver options
  headers: {},
  qs: {},
  requestOptions: {},
  customResolvers: {},
  customSubscriptionResolvers: {},
  fileUploadOptions: {},
  // Authentication options
  viewer: true,
  sendOAuthTokenInQuery: false,
  // Validation options
  oasValidatorOptions: {},
  swagger2OpenAPIOptions: {},
  // Logging options
  provideErrorExtensions: true,
  equivalentToMessages: true,
};

module.exports = DEFAULT_OPTIONS;
