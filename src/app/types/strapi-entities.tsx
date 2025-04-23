export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface BaseStrapiEntity {
  id: number;
  documentId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
}

export interface User extends BaseStrapiEntity {
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  volunteer: Volunteer
}

export interface Volunteer extends BaseStrapiEntity {
  name: string
  mail: string
  credential?: string
  volunteerBethelID?: string
  user?: User
}

export interface Group extends BaseStrapiEntity {
  name: string;
  branch: Branch
  slug: string;
  users?: User[];
}

export interface Department extends BaseStrapiEntity {
  name: string;
}

type Branch = "Argentina & Uruguay" | "Brazil"