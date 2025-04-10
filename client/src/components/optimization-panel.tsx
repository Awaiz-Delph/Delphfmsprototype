import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function OptimizationPanel() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiDown, setIsApiDown] = useState(false);
  
  const fetchOptimizations = async () => {
    setIsLoading(true);
    setError(null);
    setIsApiDown(false);
    
    try {
      const response = await apiRequest("GET", "/api/optimizations");
      const data = await response.json();
      
      setSuggestions(data.suggestions || []);
      
      // Check if we're getting the "Unable to connect to optimization service" message
      const apiErrorMessage = "Unable to connect to optimization service";
      if (data.suggestions && data.suggestions.length === 1 && data.suggestions[0].includes(apiErrorMessage)) {
        setIsApiDown(true);
      }
    } catch (err) {
      console.error("Error fetching optimization suggestions:", err);
      setError("Failed to fetch optimization suggestions");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOptimizations();
  }, []);
  
  return (
    <motion.div
      className="glass rounded-3xl p-6 relative overflow-hidden h-fit min-h-[300px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-secondary" />
          <h2 className="font-display text-xl font-medium text-white/90">
            AI Optimization Suggestions
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white/60 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10"
          onClick={fetchOptimizations}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      
      {isApiDown && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <p className="text-xs text-white/70">
            Using local optimization engine - connect to OpenAI for enhanced suggestions
          </p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-52">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-white/50">Generating AI optimization suggestions...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-52 text-center">
          <div className="text-white/30 text-5xl mb-4">
            <AlertTriangle />
          </div>
          <p className="text-white/50 max-w-md">
            {error}. Please try again later.
          </p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-center">
          <div className="text-white/30 text-5xl mb-4">
            <Lightbulb />
          </div>
          <p className="text-white/50 max-w-md">
            No optimization suggestions available at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <motion.div 
              key={index}
              className="glass-dark p-4 rounded-2xl flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="bg-secondary/20 text-secondary p-2 rounded-full flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white/90">{suggestion}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="px-0 text-secondary/80 hover:text-secondary flex items-center gap-1 mt-1"
                >
                  <span>Implement</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Decorative element */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gradient-to-r from-secondary/30 to-primary/20 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
    </motion.div>
  );
}