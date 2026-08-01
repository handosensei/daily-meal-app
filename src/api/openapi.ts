import openApiDocument from '../../public/swagger/openapi.json';

export type OpenApiPathMap = typeof openApiDocument.paths;
export type OpenApiServer = (typeof openApiDocument.servers)[number];

export const apiContract = openApiDocument;
export const apiContractVersion = openApiDocument.info.version;
export const apiServers: OpenApiServer[] = openApiDocument.servers;
export const apiPaths: OpenApiPathMap = openApiDocument.paths;
export const apiEndpointCount = Object.keys(apiPaths).length;
