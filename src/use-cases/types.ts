export type UserId = number;

export type UserProfile = {
  id: UserId;
  name: string | null;
  image: string | null;
};

export type UserSession = {
  id: UserId;
};
