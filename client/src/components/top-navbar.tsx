import { motion } from "framer-motion";
import { Link } from "wouter";

export default function TopNavbar() {
  return (
    <motion.nav 
      className="glass-dark py-3 px-6 flex justify-between items-center border-b border-white/5 z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg h-8 w-8 flex items-center justify-center">
          <i className="ri-robot-fill text-white"></i>
        </div>
        <h1 className="font-display font-bold tracking-wide text-white text-xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Delphnoid</span>
        </h1>
      </div>
      
      <div className="hidden md:flex gap-6">
        <NavLink href="/" label="Dashboard" active />
        <NavLink href="/robots" label="Robots" />
        <NavLink href="/inventory" label="Inventory" />
        <NavLink href="/analytics" label="Analytics" />
        <NavLink href="/settings" label="Settings" />
      </div>
      
      <div className="flex items-center gap-4">
        <motion.button 
          className="relative p-2 rounded-full hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="ri-notification-3-line text-xl"></i>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full"></span>
        </motion.button>
        <div className="glass p-1 rounded-full">
          <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden">
            <img 
              src="https://randomuser.me/api/portraits/men/1.jpg"
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  active?: boolean;
}

function NavLink({ href, label, active = false }: NavLinkProps) {
  return (
    <Link href={href}>
      <span className={`${active ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-all duration-200 cursor-pointer`}>
        {label}
      </span>
    </Link>
  );
}
