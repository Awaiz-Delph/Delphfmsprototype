import { useEffect, useState } from 'react';
import { X, AlertTriangle, Battery, Wrench, Package, Search, 
  ChevronRight, Truck, Info, BarChart, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import '../styles/dashboard.css';

// Define types
interface AmrData {
  id: string;
  status: string;
  tool: string;
  position: {
    x: number;
    y: number;
  };
  battery: number;
}

// Dashboard component for simplified warehouse AMR fleet management
export default function SimpleDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fleet status counts
  const [fleetStatus, setFleetStatus] = useState({
    active: 14,
    idle: 6,
    charging: 3,
    down: 1
  });
  
  // Tool pool status
  const [toolPool, setToolPool] = useState({
    pallet: { inUse: 8, available: 4 },
    tote: { inUse: 4, available: 3 },
    scanner: { inUse: 2, available: 2 }
  });
  
  // Critical alerts count
  const [alertCount, setAlertCount] = useState(3);
  
  // Overall efficiency
  const [efficiency, setEfficiency] = useState({
    fleetBusy: 78,
    idleTimeReduction: 50
  });
  
  // AMRs on the map
  const [amrs, setAmrs] = useState<AmrData[]>([
    { id: 'AMR-01', status: 'active', tool: 'pallet', position: { x: 20, y: 30 }, battery: 75 },
    { id: 'AMR-02', status: 'active', tool: 'tote', position: { x: 40, y: 50 }, battery: 82 },
    { id: 'AMR-03', status: 'idle', tool: 'scanner', position: { x: 60, y: 40 }, battery: 45 },
    { id: 'AMR-04', status: 'charging', tool: 'pallet', position: { x: 80, y: 20 }, battery: 28 },
    { id: 'AMR-05', status: 'down', tool: 'tote', position: { x: 30, y: 70 }, battery: 12 }
  ]);
  
  // Handle AMR click
  const handleAmrClick = (amr: AmrData): void => {
    console.log(`AMR ID: ${amr.id}, Status: ${amr.status}, Equipped Tool: ${amr.tool} Tool, Battery: ${amr.battery}%`);
    toast({
      title: `${amr.id} Details`,
      description: `Status: ${amr.status}, Tool: ${amr.tool}, Battery: ${amr.battery}%`,
      duration: 3000
    });
  };
  
  // Handle fleet status filter
  const handleStatusFilter = (status: string): void => {
    console.log(`Filter by: ${status}`);
    toast({
      title: 'Filter Applied',
      description: `Showing AMRs with status: ${status}`,
      duration: 3000
    });
  };
  
  // Handle tool filter
  const handleToolFilter = (tool: string): void => {
    console.log(`Filter by Tool: ${tool}`);
    toast({
      title: 'Tool Filter Applied', 
      description: `Showing AMRs equipped with: ${tool}`,
      duration: 3000
    });
  };
  
  // Handle alerts click
  const handleAlertsClick = (): void => {
    console.log('Show Alert Details');
    toast({
      title: 'Critical Alerts',
      description: `${alertCount} alerts require attention`,
      variant: 'destructive',
      duration: 3000
    });
  };
  
  return (
    <div className="delphnoid-dashboard">
      {/* Page title */}
      <div className="pt-4 px-4 md:px-6">
        <h1 className="text-2xl font-display font-medium text-white mb-2">Simple Fleet Dashboard</h1>
        <p className="text-white/60 text-sm mb-4">
          Simplified view of warehouse operations with quick status overview
        </p>
      </div>
      
      {/* Main content */}
      <div className="dashboard-content">
        {/* Widget 1: Fleet Status Overview */}
        <section className="widget fleet-status">
          <h2>Fleet Status</h2>
          <div className="status-cards">
            <div 
              className="status-card active" 
              onClick={() => handleStatusFilter('active')}
            >
              <div className="card-icon">
                <Truck size={24} />
              </div>
              <div className="card-count">{fleetStatus.active}</div>
              <div className="card-label">Active</div>
              <div className="tool-icons">
                <Package size={16} />
                <Search size={16} />
                <Wrench size={16} />
              </div>
            </div>
            
            <div 
              className="status-card idle" 
              onClick={() => handleStatusFilter('idle')}
            >
              <div className="card-icon">
                <Truck size={24} />
              </div>
              <div className="card-count">{fleetStatus.idle}</div>
              <div className="card-label">Idle</div>
            </div>
            
            <div 
              className="status-card charging" 
              onClick={() => handleStatusFilter('charging')}
            >
              <div className="card-icon">
                <Battery size={24} />
              </div>
              <div className="card-count">{fleetStatus.charging}</div>
              <div className="card-label">Charging</div>
            </div>
            
            <div 
              className="status-card down" 
              onClick={() => handleStatusFilter('down')}
            >
              <div className="card-icon">
                <X size={24} />
              </div>
              <div className="card-count">{fleetStatus.down}</div>
              <div className="card-label">Down</div>
            </div>
          </div>
        </section>
        
        {/* Widget 2: Tool Pool Status */}
        <section className="widget tool-pool">
          <h2>Tool Pool Status</h2>
          <div className="tool-cards">
            <div 
              className="tool-card" 
              onClick={() => handleToolFilter('pallet')}
            >
              <div className="tool-icon">
                <Package size={24} />
              </div>
              <div className="tool-name">Pallet Tool</div>
              <div className="tool-stats">
                <div className="in-use">In Use: {toolPool.pallet.inUse}</div>
                <div className="available">Available: {toolPool.pallet.available}</div>
              </div>
            </div>
            
            <div 
              className="tool-card" 
              onClick={() => handleToolFilter('tote')}
            >
              <div className="tool-icon">
                <Package size={24} />
              </div>
              <div className="tool-name">Tote Tool</div>
              <div className="tool-stats">
                <div className="in-use">In Use: {toolPool.tote.inUse}</div>
                <div className="available">Available: {toolPool.tote.available}</div>
              </div>
            </div>
            
            <div 
              className="tool-card" 
              onClick={() => handleToolFilter('scanner')}
            >
              <div className="tool-icon">
                <Search size={24} />
              </div>
              <div className="tool-name">Scanner Tool</div>
              <div className="tool-stats">
                <div className="in-use">In Use: {toolPool.scanner.inUse}</div>
                <div className="available">Available: {toolPool.scanner.available}</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Widget 3: Critical Alerts */}
        <section 
          className={`widget alerts ${alertCount > 0 ? 'has-alerts' : ''}`}
          onClick={handleAlertsClick}
        >
          <h2>Critical Alerts</h2>
          <div className="alert-content">
            <div className="alert-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="alert-count">{alertCount}</div>
          </div>
        </section>
        
        {/* Widget 4: Efficiency Snapshot */}
        <section className="widget efficiency">
          <h2>Efficiency Snapshot</h2>
          <div className="efficiency-content">
            <div className="efficiency-gauge">
              <div className="gauge-label">Overall Fleet Busy %</div>
              <div className="gauge-container">
                <div 
                  className="gauge-fill" 
                  style={{ width: `${efficiency.fleetBusy}%` }}
                ></div>
              </div>
              <div className="gauge-value">{efficiency.fleetBusy}%</div>
            </div>
            <div className="efficiency-highlight">
              <BarChart size={20} />
              <span>Idle Time Reduced by: ~{efficiency.idleTimeReduction}%</span>
            </div>
          </div>
        </section>
        
        {/* Main Area: Live Warehouse Map */}
        <section className="widget warehouse-map">
          <h2>Live Warehouse Map</h2>
          <div className="map-container">
            {/* Placeholder for map */}
            <div className="map-placeholder">
              {amrs.map((amr) => (
                <div 
                  key={amr.id}
                  className={`amr-icon ${amr.status}`}
                  style={{ 
                    left: `${amr.position.x}%`, 
                    top: `${amr.position.y}%` 
                  }}
                  onClick={() => handleAmrClick(amr)}
                >
                  {amr.tool === 'pallet' && <Package size={20} />}
                  {amr.tool === 'tote' && <Package size={20} />}
                  {amr.tool === 'scanner' && <Search size={20} />}
                </div>
              ))}
              
              <div className="map-zones">
                <div className="zone zone-a">Zone A</div>
                <div className="zone zone-b">Zone B</div>
                <div className="zone zone-c">Zone C</div>
              </div>
            </div>
            <div className="map-note">
              <Info size={16} />
              <span>Interactive warehouse map showing AMRs with their current tool attachments</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}