/**
 * Search History - Previous searches view
 */

import React, { useState, useEffect } from "react";
import { History, Search, Trash2, RotateCw, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getSearchHistory,
  deleteSearchHistory,
  SearchHistoryItem,
} from "@/services/api/researcher";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { Spinner } from "@/components/ui/spinner";

// Helper to format search method names for display
// const formatSearchMethod = (method: string) => {
//   const methodMap: Record<string, string> = {
//     hybrid: "Hybrid (BM25 + SBERT)",
//     bm25: "BM25 (Keyword)",
//     sbert: "SBERT (Semantic)",
//   };
//   return methodMap[method.toLowerCase()] || method;
// };

export default function SearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page: number) => {
    try {
      setLoading(true);
      console.log(`📥 Fetching search history page ${page}...`);
      const response = await getSearchHistory(page, 10); // Limit to 10 per page
      console.log("📊 Search history response:", response);
      setHistory(response.history);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("❌ Failed to fetch search history:", error);
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Last page
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
  };

  const handleDelete = async (searchId: string) => {
    try {
      await deleteSearchHistory(searchId);
      setHistory((prev) => prev.filter((item) => item.id !== searchId));
      toast({
        title: "Deleted",
        description: "Search removed from history",
      });
    } catch (error) {
      console.error("Failed to delete search:", error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "error",
      });
    }
  };

  const handleRerun = async (item: SearchHistoryItem) => {
    try {
      toast({
        title: "Re-running search...",
        description: "Please wait",
      });

      // Navigate to search page with the query
      navigate("/researcher/search", {
        state: {
          query: item.query_text,
          filters: item.filters,
        },
      });
    } catch (error) {
      console.error("Failed to rerun search:", error);
      toast({
        title: "Error",
        description: "Failed to rerun search",
        variant: "error",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <Spinner variant="bars" size={48} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats Summary */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "search" : "searches"} total
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No search history yet
            </h3>
            <p className="text-muted-foreground">
              Your search history will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Search className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-medium text-foreground truncate">
                        {item.query_text}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">
                          {item.results_count}
                        </span>{" "}
                        results
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span>{formatDate(item.created_at)}</span>

                      {item.filters && Object.keys(item.filters).length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="secondary" className="text-xs">
                            <Filter className="h-3 w-3 mr-1" />
                            {Object.keys(item.filters).length} filters
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRerun(item)}
                      className="text-primary hover:text-primary hover:bg-accent"
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Re-run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && history.length > 0 && totalPages > 1 && (
        <div className="mt-8 pb-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPageNumbers()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
