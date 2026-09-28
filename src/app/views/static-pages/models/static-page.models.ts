export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export type StaticPageInput = Pick<StaticPage, 'slug' | 'title' | 'content'>;

export interface StaticPageApiResponse<T> {
  message: string;
  data: T;
}
