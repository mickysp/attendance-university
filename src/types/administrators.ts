export type AdministratorRole = "Teacher" | "Teaching Assistant";

export interface Administrator {
  _id: string;
  prefix: string;
  fullname: string;
  username: string;
  email: string;
  role: AdministratorRole;
}

export type CreateAdministratorBody = Omit<Administrator, "_id"> & {
  password: string;
};
