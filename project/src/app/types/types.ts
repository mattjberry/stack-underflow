// channel info
export type Channel = {
    id: number;
    name: string;
    description: string;
    created_by: number;
    created_at: Date;
    post_count: number;
};

// individual posts
export type Post = {
  id: number;
  channel_id: number;
  author_id: number;
  author_name: string;
  title: string;
  body: string;
  created_at: Date;
  reply_count: number;
};