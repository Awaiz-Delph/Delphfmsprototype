import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Send, X, Info, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useWarehouse } from "@/context/warehouse-context";
import { AIMessage } from "@shared/types";
import { cn } from "@/lib/utils";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { transcript, listening, startListening, stopListening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { messages, sendQuery, isProcessing } = useWarehouse();
  const [inputValue, setInputValue] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Effect to set up speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      
      // Set voice properties
      speechSynthesisRef.current.rate = 1.0; // Normal speed
      speechSynthesisRef.current.pitch = 1.0; // Normal pitch
      speechSynthesisRef.current.volume = 1.0; // Full volume
      
      // Function to set the voice
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Try to find a female voice
          const femaleVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Samantha') ||
            voice.name.includes('Google UK English Female')
          );
          
          if (femaleVoice && speechSynthesisRef.current) {
            speechSynthesisRef.current.voice = femaleVoice;
          }
        }
      };
      
      // Set voice immediately if voices are already loaded
      setVoice();
      
      // Set up event listeners
      window.speechSynthesis.onvoiceschanged = setVoice;
      
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.onstart = () => setIsSpeaking(true);
        speechSynthesisRef.current.onend = () => setIsSpeaking(false);
        speechSynthesisRef.current.onerror = () => setIsSpeaking(false);
      }
      
      // Clean up on unmount
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);
  
  // Speak text function
  const speakText = (text: string) => {
    if (!isVoiceEnabled || !speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Clean the text from any markdown or special characters
    const cleanText = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\[|\]/g, "");
    
    // Set the text and speak
    speechSynthesisRef.current.text = cleanText;
    window.speechSynthesis.speak(speechSynthesisRef.current);
  };
  
  // Toggle voice output
  const toggleVoice = () => {
    // If turning off while speaking, stop the current speech
    if (isVoiceEnabled && isSpeaking && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setIsVoiceEnabled(!isVoiceEnabled);
  };
  
  // Automatically speak new assistant messages if voice is enabled
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const latestMessage = messages[messages.length - 1].content;
      speakText(latestMessage);
    }
  }, [messages]);
  
  // Auto-submit when speech input is detected and user stops speaking
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
      
      // If user stops speaking and we have transcript content, auto-submit
      if (!listening && transcript.trim().length > 0) {
        const timer = setTimeout(() => {
          if (!isProcessing && transcript.trim()) {
            sendQuery(transcript);
            setInputValue("");
            resetTranscript();
            
            // Close the assistant after query is sent
            setTimeout(() => {
              setIsOpen(false);
            }, 400);
          }
        }, 1000); // Wait 1 second after user stops speaking
        
        return () => clearTimeout(timer);
      }
    }
  }, [transcript, listening, isProcessing, sendQuery, resetTranscript]);
  
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing) {
      sendQuery(inputValue);
      setInputValue("");
      resetTranscript();
      
      // Close the assistant after a slight delay to show the message
      setTimeout(() => {
        setIsOpen(false);
      }, 400);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  return (
    <>
      {/* AI Assistant Floating Button */}
      <motion.div 
        className="fixed bottom-8 right-8 z-[9999] pointer-events-auto"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.5 }}
      >
        <div className="relative">
          {/* Pulsing rings */}
          <div className="assistant-ring absolute inset-0 rounded-full bg-primary opacity-20"></div>
          
          {/* Main button */}
          <Button
            onClick={() => setIsOpen(true)}
            id="ai-assistant-button"
            className="w-16 h-16 rounded-full cursor-pointer bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            type="button"
          >
            <Bot className="text-2xl text-white" />
          </Button>
        </div>
      </motion.div>
      
      {/* AI Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="glass-dark rounded-3xl w-full max-w-lg mx-4 p-6 shadow-xl pointer-events-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center",
                    isSpeaking && "animate-pulse"
                  )}>
                    <Bot className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-medium">Delphnoid AI Assistant</h2>
                    {isSpeaking && (
                      <div className="flex items-center gap-1.5 text-xs text-primary/80">
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                        <span>Speaking...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={toggleVoice}
                    className={cn(
                      "text-white/60 hover:text-white h-8 w-8",
                      isVoiceEnabled ? "text-secondary/80" : "text-white/40"
                    )}
                  >
                    {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-black/50 rounded-2xl p-4 mb-6 h-80 overflow-y-auto border border-white/10 shadow-inner">
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <MessageBubble 
                      key={index} 
                      message={message} 
                      onSpeakMessage={isVoiceEnabled ? speakText : undefined} 
                    />
                  ))}
                  <div ref={messageEndRef} />
                </div>
              </div>
              
              <div className="flex gap-2">
                {browserSupportsSpeechRecognition && (
                  <Button
                    onClick={listening ? stopListening : startListening}
                    className={`flex-shrink-0 w-12 h-12 rounded-full ${
                      listening ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask about warehouse operations..."
                    className="w-full h-12 pl-4 pr-12 rounded-full bg-dark border border-white/10 focus:border-primary/50 focus:outline-none text-white caret-white"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center disabled:opacity-50"
                  >
                    {isProcessing ? 
                      <Loader2 className="h-4 w-4 text-white animate-spin" /> : 
                      <Send className="h-4 w-4 text-white" />
                    }
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col space-y-2 items-center">
                <div className="flex gap-2 glass px-3 py-1.5 rounded-full text-white/60 text-sm">
                  <Info className="h-4 w-4" />
                  <p>Try asking: "Where is AMR 02?" or "Show Zone B activity"</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  <button 
                    onClick={() => setInputValue("Compare AMR 01 and AMR 03")}
                    className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full text-white transition-colors"
                  >
                    Compare AMRs
                  </button>
                  <button 
                    onClick={() => setInputValue("Idle robots in Zone A")}
                    className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full text-white transition-colors"
                  >
                    Idle robots
                  </button>
                  <button 
                    onClick={() => setInputValue("Prioritize Zone B")}
                    className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full text-white transition-colors"
                  >
                    Prioritize zone
                  </button>
                  <button 
                    onClick={() => setInputValue("Optimize warehouse resources")}
                    className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full text-white transition-colors"
                  >
                    Resource optimization
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface MessageBubbleProps {
  message: AIMessage;
  onSpeakMessage?: (text: string) => void;
}

function MessageBubble({ message, onSpeakMessage }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  const handleSpeakClick = () => {
    if (!isUser && onSpeakMessage) {
      onSpeakMessage(message.content);
    }
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-3`}>
      <div 
        className={cn(
          "px-4 py-3 max-w-[85%] cursor-pointer shadow-md transition-shadow hover:shadow-lg border",
          isUser 
            ? "bg-white/20 rounded-2xl rounded-tr-sm text-right border-white/20" 
            : "bg-primary/30 rounded-2xl rounded-tl-sm border-primary/30"
        )}
        onClick={handleSpeakClick}
      >
        <p className="text-white font-medium leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
