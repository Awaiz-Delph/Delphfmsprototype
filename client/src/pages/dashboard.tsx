import { motion } from "framer-motion";
import WarehouseDashboard from "@/components/warehouse-dashboard";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { useWarehouse } from "@/context/warehouse-context";

export default function Dashboard() {
  const { connectWebsocket } = useWarehouse();
  
  // Connect to WebSocket when dashboard loads
  useEffect(() => {
    connectWebsocket();
  }, [connectWebsocket]);
  
  return (
    <>
      <Helmet>
        <title>Delphnoid - Warehouse Automation System</title>
        <meta name="description" content="Advanced warehouse automation system with AI assistant" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
      </Helmet>
      
      <div className="flex-1 flex flex-col">
        <div className="pt-4 px-4 md:px-6">
          <h1 className="text-2xl font-display font-medium text-white mb-2">Warehouse Dashboard</h1>
          <p className="text-white/60 text-sm mb-4">
            Real-time monitoring and control of warehouse operations
          </p>
        </div>
        <WarehouseDashboard />
      </div>
    </>
  );
}
