import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, RefreshCw, Database, Clock } from "lucide-react";

interface ScraperStatus {
  last_scrape_time: number;
  last_scrape_formatted: string;
  cached_properties_count: number;
  is_recent: boolean;
}

interface ScrapeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  properties_count: number;
  error?: string;
}

export function ScraperControl() {
  const [lastScrapeResult, setLastScrapeResult] = useState<ScrapeResponse | null>(null);

  // Get scraper status
  const { data: status, refetch: refetchStatus } = useQuery<ScraperStatus>({
    queryKey: ["/api/scraper-status"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Manual scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/scrape-railey", {
        method: "POST"
      });
      return response as ScrapeResponse;
    },
    onSuccess: (data) => {
      setLastScrapeResult(data);
      // Refresh properties list and scraper status
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      refetchStatus();
    },
    onError: (error) => {
      setLastScrapeResult({
        success: false,
        message: "Scraping failed",
        timestamp: new Date().toISOString(),
        properties_count: 0,
        error: String(error)
      });
    }
  });

  const handleScrape = () => {
    setLastScrapeResult(null);
    scrapeMutation.mutate();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Railey.com Data Scraper
        </CardTitle>
        <CardDescription>
          Manually refresh property data from Railey.com using AI-powered extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Last Scrape:</span>
          </div>
          <div className="text-right">
            <p className="text-sm">{status?.last_scrape_formatted || "Never"}</p>
            <Badge variant={status?.is_recent ? "default" : "secondary"} className="text-xs">
              {status?.cached_properties_count || 0} properties
            </Badge>
          </div>
        </div>

        {/* Scrape Button */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleScrape} 
            disabled={scrapeMutation.isPending}
            size="lg"
            className="w-full"
          >
            {scrapeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping Properties...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Scrape Railey.com Now
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Uses OpenAI to extract real property data from Railey.com
          </p>
        </div>

        {/* Results */}
        {lastScrapeResult && (
          <div className={`p-3 rounded-lg border ${
            lastScrapeResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={lastScrapeResult.success ? "default" : "destructive"}>
                {lastScrapeResult.success ? "Success" : "Failed"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(lastScrapeResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm">{lastScrapeResult.message}</p>
            {lastScrapeResult.success && lastScrapeResult.properties_count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Found {lastScrapeResult.properties_count} properties from Railey.com
              </p>
            )}
            {lastScrapeResult.error && (
              <p className="text-xs text-red-600 mt-1">
                Error: {lastScrapeResult.error}
              </p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            How it works:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
            <li>• Fetches the latest listings from Railey.com</li>
            <li>• Uses OpenAI to extract property details from the HTML</li>
            <li>• Updates the chatbot with real Deep Creek Lake properties</li>
            <li>• Manual trigger prevents API limit issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}