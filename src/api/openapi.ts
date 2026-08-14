import openApiDocument from '../../public/swagger/openapi.json';

export type OpenApiPathMap = typeof openApiDocument.paths;
export type OpenApiServer = {
  url: string;
  description?: string;
};

export const apiContract = openApiDocument;
export const apiContractVersion = openApiDocument.info.version;
export const apiServers: OpenApiServer[] = openApiDocument.servers as OpenApiServer[];
export const apiPaths: OpenApiPathMap = openApiDocument.paths;
export const apiEndpointCount = Object.keys(apiPaths).length;
