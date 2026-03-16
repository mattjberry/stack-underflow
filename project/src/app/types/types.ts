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
  vote_score: number;
};

// Reply
export type Reply = {
  id: number;
  post_id: number;
  parent_reply_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: Date;
  vote_score: number;
}

// Attachments
export type Attachment = {
  id: number;
  target_type: string;
  target_id: number;
  mime_type: string;
  size_bytes: number;
  file_path: string;
}