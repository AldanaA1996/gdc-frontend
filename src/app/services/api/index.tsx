import { BaseStrapiEntity } from "@/app/types/strapi-entities";
import { base64ToFile } from "@utils/files";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export type ApiResponseShape<T> = { data?: T; error?: any };
export type ApiResponse<T> = Promise<ApiResponseShape<T>>;

export type MediaFieldDescriptor = {
  [key: string]:
    | "video"
    | "videos"
    | "image"
    | "images"
    | "document"
    | "documents"
    | "any";
};

export type MediaFieldValueDescriptor = {
  key: string;
  value: String | File | String[] | File[];
};

export const api = axios.create({
  baseURL: import.meta.env.PUBLIC_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setToken = (token: string) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const removeToken = () => {
  delete api.defaults.headers.common.Authorization;
};

async function defaultStrapiRequest<T>(
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<T>({
      method,
      url,
      data: data ? { data } : undefined,
      ...config,
    });

    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    return {
      error: {
        status: error.response?.status,
        message: error.response?.data || error.message,
      },
    };
  }
}

type StrapiAction = "find" | "findOne" | "create" | "update" | "delete";

interface RequestOptions {
  documentId?: string;
  data?: any;
  params?: StrapiFindParams | Record<string, any>;
}

export async function strapiRequest<T>(
  entity: string,
  action: StrapiAction,
  options: RequestOptions = { params: { populate: "*" } }
): Promise<ApiResponse<T>> {
  let method: "get" | "post" | "put" | "delete" = "get";
  let url = `/`;

  switch (action) {
    case "find":
      url += `${entity}`;
      method = "get";
      break;
    case "findOne":
      if (!options.documentId)
        throw new Error("Missing Document ID for findOne");
      url += `${entity}/${options.documentId}`;
      method = "get";
      break;
    case "create":
      url += `${entity}`;
      method = "post";
      break;
    case "update":
      if (!options.documentId)
        throw new Error("Missing Document ID for update");
      url += `${entity}/${options.documentId}`;
      method = "put";
      const { id, documentId, createdAt, updatedAt, publishedAt, ...data } =
        options.data;

      options.data = data;

      break;
    case "delete":
      if (!options.documentId)
        throw new Error("Missing Document ID for delete");
      url += `${entity}/${options.documentId}`;
      method = "delete";
      break;
  }

  return defaultStrapiRequest<T>(
    method,
    url,
    options.data ?? undefined,
    options.params ? { params: options.params } : undefined
  );
}

export type StrapiFindParams = {
  filters?: Record<string, any>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  populate?: string | string[];
  fields?: string[];
  [key: string]: any; // for other params like publicationState, locale, etc.
};

export function findEntity<T>(entity: string, params: StrapiFindParams = {}) {
  return strapiRequest<T[]>(entity, "find", { params });
}

export const mapApiErrors = {
  NetworkError: "Error de red",
  default: "Error desconocido",
  ForbiddenError: "No tienes permisos para acceder",
};

export const getApiError = (error, entity?) => {
  const errorName =
    typeof error?.message === "string"
      ? error.message
      : error.message.error.name;

  const errorMessage = entity
    ? mapApiErrors?.[entity]?.[errorName] || mapApiErrors[entity]?.default
    : mapApiErrors?.[errorName];

  return errorMessage || mapApiErrors.default;
};

export type RelationAction<T> = {
  entity: EntityMetadata;
  set?: Partial<T>[];
  connect?: Partial<T>[];
  disconnect?: Partial<T>[];
};

export async function requestUpload<T>(
  entityMetadata: EntityMetadata,
  field: string,
  id: number,
  documentId: string,
  files: File | File[],
  refetchOptions?: RequestOptions
): ApiResponse<T> {
  const formData = new FormData();

  if (Array.isArray(files)) {
    files.forEach((file) => formData.append("files", file));
  } else {
    formData.append("files", files);
  }

  formData.append("ref", entityMetadata.modelRefName);
  formData.append("refId", String(id));
  formData.append("field", field);

  try {
    await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const result = await strapiRequest<T>(entityMetadata.plural, "findOne", {
      documentId: refetchOptions?.documentId || documentId,
      params: refetchOptions?.params || { populate: "*" },
    });
    return result;
  } catch (err) {
    const error = err as AxiosError;
    return {
      error: {
        status: error.response?.status,
        message: error.response?.data || error.message,
      },
    };
  }
}

export function verifyMediaFields(mediaFields: MediaFieldDescriptor, data) {
  const currentMediaFiles: MediaFieldValueDescriptor[] = [];
  for (const key of Object.keys(data)) {
    if (Object.keys(mediaFields).includes(key)) {
      const value = data[key];
      if (value && typeof value === "string") {
        currentMediaFiles.push({ key, value });
        delete data[key];
      }
    }
  }
  return currentMediaFiles;
}

export async function handleUpload<T>(
  currentMediaFiles: MediaFieldValueDescriptor[],
  entityMetadata: EntityMetadata,
  id: number,
  documentId: string
): Promise<ApiResponseShape<T> | ApiResponseShape<T>[]> {
  const uploadResults: ApiResponseShape<T>[] = [];
  for (const uploadData of currentMediaFiles) {
    const { key, value } = uploadData;

    let files: File[] = [];
    if (typeof value === "string") {
      files.push(base64ToFile(value, `credential__${documentId}`));
    }

    const uploadResult = await requestUpload<T>(
      entityMetadata,
      key,
      id,
      documentId,
      files
    );
    uploadResults.push(uploadResult);
  }

  return uploadResults.length === 1 ? uploadResults[0] : uploadResults;
}

export type EntityMetadata = {
  plural: string;
  singular: string;
  modelRefName: string;
  mediaFields?: MediaFieldDescriptor;
};

export function handleRelationships<T>(
  data: Partial<T> & BaseStrapiEntity,
  relationActions: RelationAction<T>[]
) {
  for (const {
    entity: { singular: entitySingular },
    set,
    connect,
    disconnect,
  } of relationActions) {
    if (set) {
      data[entitySingular] = {
        set: set.map(({ documentId }) => documentId),
      };
    }

    if (connect) {
      data[entitySingular] = {
        connect: connect.map(({ documentId }) => documentId),
      };
    }

    if (disconnect) {
      data[entitySingular] = {
        disconnect: disconnect.map(({ documentId }) => documentId),
      };
    }
  }

  let populate: string | string[] = "*";
  for (const { entity } of relationActions) {
    const { mediaFields } = entity;
    if (populate === "*") {
      populate = [];
    }
    if (Array.isArray(populate)) {
      populate = Object.keys(mediaFields).map((f) => `${entity.singular}.${f}`);
    }
  }

  return data;
}
