/**
 * Search Interface - Main search functionality
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Sparkles,
  Filter,
  Download,
  CheckSquare,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedParticipantCard } from "@/components/researcher/AnimatedParticipantCard";
import { OutreachModal } from "@/components/researcher/OutreachModal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchParticipants, logSearch, createNotification } from "@/services/api/researcher";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Participant {
  id: string;
  name: string;
  role: string;
  company_name: string;
  remote: boolean;
  tools: string[];
  skills?: string[];
  description: string;
  score: number;
  rank?: number;
}

export default function SearchInterface() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Participant[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 20;

  const handleSearch = async (page: number = 1) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(page);
    
    // Only clear results and selections on new search (page 1)
    if (page === 1) {
      setResults([]);
      setSelectedIds(new Set());
    }

    try {
      const response = await searchParticipants({
        query: query,
        top_k: 100, // Fetch more results for better pagination
        page: page,
        limit: itemsPerPage,
      });

      // Map backend response to frontend format
      const mappedResults = response.results.map((result: any) => ({
        id: result.participant.id,
        name: result.participant.name,
        role: result.participant.role,
        company_name: result.participant.company_name,
        remote: result.participant.remote,
        tools: result.participant.tools || [],
        skills: result.participant.skills || [],
        description: result.participant.description || "",
        score: result.score,
        rank: result.rank,
      }));

      setResults(mappedResults);
      setTotalResults(response.total_count);
      setTotalPages(response.total_pages);
      setCurrentPage(page);
      setSearchTime(response.retrieval_time_ms);

      // Log search to history (only on first page)
      if (page === 1) {
        try {
          await logSearch({
            query_text: query,
            filters: {},
            search_type: response.method || "hybrid",
            results_count: response.total_count,
            top_result_ids: mappedResults.slice(0, 10).map((r) => r.id),
          });
          console.log("✅ Search logged to history successfully");
        } catch (logError) {
          console.error("❌ Failed to log search:", logError);
        }

        // Create notification for successful search (only if 5+ results)
        if (response.total_count >= 5) {
          createNotification({
            title: "Search completed",
            message: `Found ${response.total_count} matches for "${query}"`,
            type: "success",
            related_entity_type: "search",
          }).catch((err) => console.error("Failed to create notification:", err));
        }
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(
        err.response?.data?.detail || "Search failed. Please try again."
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Selection handlers
  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const selectTopN = (n: number) => {
    const topIds = results.slice(0, n).map((p) => p.id);
    setSelectedIds(new Set(topIds));
  };

  const selectByThreshold = (threshold: number) => {
    const qualifiedIds = results
      .filter((p) => p.score >= threshold)
      .map((p) => p.id);
    setSelectedIds(new Set(qualifiedIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(results.map((p) => p.id)));
  };

  // Outreach generation
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [modalParticipants, setModalParticipants] = useState<Participant[]>([]);
  const [modalLoadedDraft, setModalLoadedDraft] = useState<any>(null);

  // Handle reopening modal when navigating back from full page
  // AND handle pre-filled query from search history
  useEffect(() => {
    if (location.state) {
      const { reopenOutreachModal, participants, loadedDraft, query: historyQuery, filters } =
        location.state as any;
      
      // Handle modal reopening
      if (reopenOutreachModal && participants) {
        setModalParticipants(participants);
        setModalLoadedDraft(loadedDraft);
        setShowOutreachModal(true);
        // Clear the state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
      }
      
      // Handle query from search history
      if (historyQuery) {
        setQuery(historyQuery);
        // Auto-run the search
        setTimeout(() => {
          handleSearch();
        }, 100);
        // Clear the state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

  // Handle page change
  const handlePageChange = (page: number) => {
    handleSearch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
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
      // Show first page
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

      // Show ellipsis if needed
      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
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

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show last page
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

  const handleBulkOutreach = () => {
    const selected = results.filter((p) => selectedIds.has(p.id));
    setModalParticipants(selected);
    setModalLoadedDraft(null);
    setShowOutreachModal(true);
  };

  const handleGenerateOutreach = async (participantIds: string[]) => {
    try {
      const { generateOutreach } = await import("@/services/api/researcher");
      const response = await generateOutreach(participantIds);
      return response.emails;
    } catch (error) {
      console.error("Failed to generate outreach:", error);
      // Fallback to mock data if API fails
      return participantIds.map((id) => {
        const participant = results.find((p) => p.id === id);
        return {
          subject: `Invitation to participate in UX research - ${participant?.role} insights needed`,
          body: `Hi ${participant?.name},\n\nI came across your profile and was impressed by your experience as a ${participant?.role}${participant?.company_name ? ` at ${participant?.company_name}` : ""}.\n\nWe're currently conducting user research and would love to get your insights. Your expertise would be invaluable to our project.\n\nWould you be available for a 30-minute interview? We offer compensation for your time.\n\nLooking forward to hearing from you!\n\nBest regards`,
          participant_name: participant?.name || "Participant",
        };
      });
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      {/* Search Bar */}
      <Card className="mb-6 p-2">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., Remote product managers who use Trello and manage teams of 3-10 people"
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 w-12"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            className="h-12 px-6 bg-primary hover:bg-primary/90"
          >
            {isSearching ? (
              <>
                <Spinner variant="bars" size={16} className="mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2"
            >
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Type</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="">Any</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Size</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="">Any</option>
                      <option value="1-10">1-10</option>
                      <option value="10-50">10-50</option>
                      <option value="50-200">50-200</option>
                      <option value="200-500">200-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="">Any</option>
                      <option value="0-2">0-2 years</option>
                      <option value="2-5">2-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Example Queries - Show only before first search */}
      {!hasSearched && !isSearching && results.length === 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Try these example searches:
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Remote product managers using Trello",
              "UX designers with 5+ years experience",
              "Software engineers at startups",
              "Marketing professionals in SaaS companies",
            ].map((example) => (
              <Badge
                key={example}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-2 px-4"
                onClick={() => setQuery(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-4 p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="flex flex-col items-center space-y-6">
            <Spinner variant="bars" size={48} className="text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                Searching for participants...
              </p>
              <p className="text-sm text-muted-foreground">
                Using AI to find the best matches
              </p>
            </div>
          </div>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Found {totalResults} participants
              </h2>
              {totalPages > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Selection Controls */}
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quick Select:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectTopN(5)}
                >
                  Top 5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectTopN(10)}
                >
                  Top 10
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectTopN(20)}
                >
                  Top 20
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectByThreshold(0.7)}
                >
                  Matches &gt;70%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectByThreshold(0.5)}
                >
                  Matches &gt;50%
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="text-destructive hover:text-destructive/80"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 flex-1 pb-24">
            {results.map((participant) => (
              <AnimatedParticipantCard
                key={participant.id}
                participant={participant}
                isSelected={selectedIds.has(participant.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 mb-24">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || isSearching}
                      className={currentPage === 1 || isSearching ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {renderPageNumbers()}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || isSearching}
                      className={currentPage === totalPages || isSearching ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Floating Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
              >
                <Card className="shadow-2xl border-primary bg-card px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-bold text-primary">
                        {selectedIds.size}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        participant{selectedIds.size !== 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <Button
                      onClick={handleBulkOutreach}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Generate Outreach for {selectedIds.size}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : hasSearched && !error ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Search className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                No participants found
              </h3>
              <p className="text-muted-foreground mb-4">
                Your search for "{query}" didn't match any participants.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try using different keywords or more general terms.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <p className="text-sm font-medium text-muted-foreground w-full mb-2">
                  Suggestions:
                </p>
                {[
                  "Product Manager",
                  "Software Engineer",
                  "Designer",
                  "remote",
                ].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setQuery(suggestion);
                      setHasSearched(false);
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Outreach Generation Modal */}
      <OutreachModal
        isOpen={showOutreachModal}
        onClose={() => {
          setShowOutreachModal(false);
          setModalParticipants([]);
          setModalLoadedDraft(null);
        }}
        participants={modalParticipants}
        onGenerate={handleGenerateOutreach}
        loadedDraft={modalLoadedDraft}
      />
    </div>
  );
}
