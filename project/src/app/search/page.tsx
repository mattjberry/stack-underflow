"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./search.module.css";
import Spinner from "@/components/Spinner";

type SearchResult = {
  result_type?: "post" | "reply";
  id: number;
  title?: string;
  snippet?: string;
  author_name?: string;
  channel_name?: string;
  created_at?: string;
  post_count?: number;
  vote_score?: number;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const SEARCH_TYPES = [
  { value: "content",      label: "Search Content",       hasQuery: true },
  { value: "author",       label: "Search by Author",     hasQuery: true },
  { value: "most_posts",   label: "Most Active Users",    hasQuery: false },
  { value: "least_posts",  label: "Least Active Users",   hasQuery: false },
  { value: "top_rated",    label: "Highest Rated Posts",  hasQuery: false },
  { value: "lowest_rated", label: "Lowest Rated Posts",   hasQuery: false },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "content");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const selectedType = SEARCH_TYPES.find((t) => t.value === type);

  // Run search when URL params change
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const t = searchParams.get("type") ?? "content";
    const p = parseInt(searchParams.get("page") ?? "1");
    setQuery(q);
    setType(t);
    setPage(p);
    runSearch(q, t, p);
  }, [searchParams]);

  async function runSearch(q: string, t: string, p: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q, type: t, page: p.toString()
      });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams(query, type, 1);
  }

  function pushParams(q: string, t: string, p: number) {
    const params = new URLSearchParams({ q, type: t, page: p.toString() });
    router.push(`/search?${params}`);
  }

  function handleTypeChange(newType: string) {
    setType(newType);
    // If new type doesn't need a query, search immediately
    const t = SEARCH_TYPES.find((st) => st.value === newType);
    if (!t?.hasQuery) {
      pushParams("", newType, 1);
    }
  }

  function renderResult(result: SearchResult) {
    // User stat results (most/least posts)
    if (result.post_count !== undefined && !result.result_type) {
      return (
        <li key={result.id} className={styles.card}>
          <span className={styles.resultTitle}>{result.author_name}</span>
          <span className={styles.resultMeta}>
            {result.post_count} posts
          </span>
        </li>
      );
    }

    // Content results (posts and replies)
    const isReply = result.result_type === "reply";
    const href = `/channels/${result.channel_name}/posts/${result.id}`;

    return (
      <li key={`${result.result_type}-${result.id}`} className={styles.card}>
        <div className={styles.resultHeader}>
          <span className={isReply ? styles.badgeReply : styles.badgePost}>
            {isReply ? "Reply" : "Post"}
          </span>
          <span className={styles.resultChannel}>
            in {result.channel_name}
          </span>
        </div>
        <Link href={href} className={styles.resultTitle}>
          {result.title}
        </Link>
        <p className={styles.resultSnippet}>
          {result.snippet && result.snippet.length > 200
            ? result.snippet.slice(0, 200) + "..."
            : result.snippet}
        </p>
        <div className={styles.resultMeta}>
          By {result.author_name} ·{" "}
          {result.created_at &&
            new Date(result.created_at).toLocaleDateString()}
          {result.vote_score !== undefined && (
            <> · {result.vote_score > 0
              ? `+${result.vote_score}`
              : result.vote_score} votes
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search</h1>

      {/* Search form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.filters}>
          {SEARCH_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`${styles.filterButton} ${
                type === t.value ? styles.filterButtonActive : ""
              }`}
              onClick={() => handleTypeChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {selectedType?.hasQuery && (
          <div className={styles.searchRow}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                type === "author"
                  ? "Enter a username..."
                  : "Enter search terms..."
              }
              className={styles.input}
              autoFocus
            />
            <button type="submit" className={styles.button}>
              Search
            </button>
          </div>
        )}
      </form>

      {/* Results */}
      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <Spinner message="Searching..." />
      ) : response ? (
        <>
          <p className={styles.resultCount}>
            {response.total === 0
              ? "No results found"
              : `${response.total} result${response.total !== 1 ? "s" : ""} 
                 (page ${response.page} of ${response.totalPages})`}
          </p>

          {response.results.length === 0 ? (
            <p className={styles.empty}>No results found.</p>
          ) : (
            <ul className={styles.list}>
              {response.results.map(renderResult)}
            </ul>
          )}

          {/* Pagination */}
          {response.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.button}
                disabled={page <= 1}
                onClick={() => pushParams(query, type, page - 1)}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {response.totalPages}
              </span>
              <button
                className={styles.button}
                disabled={page >= response.totalPages}
                onClick={() => pushParams(query, type, page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <p className={styles.empty}>
          Enter a search term or select a filter above.
        </p>
      )}
    </div>
  );
}