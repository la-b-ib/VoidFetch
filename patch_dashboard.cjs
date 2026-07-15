const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardOverview.tsx', 'utf8');

if (!code.includes('Server, Terminal, Network, Search, Cpu')) {
  code = code.replace(
    "import { Shield, AlertTriangle, CheckCircle, FileKey, X, Activity, Clock, Globe } from 'lucide-react';",
    "import { Shield, AlertTriangle, CheckCircle, FileKey, X, Activity, Clock, Globe, Server, Terminal, Network, Search, Cpu } from 'lucide-react';"
  );
}

if (!code.includes('interface TargetInfo')) {
  code = code.replace(
    "export function DashboardOverview({ logs }: Props) {",
    `interface TargetInfo {
  ip: string;
  server: string;
  xPoweredBy: string;
  securityHeaders: string[];
  isLoading: boolean;
}

export function DashboardOverview({ logs }: Props) {`
  );
}

if (!code.includes('const [targetInfo, setTargetInfo]')) {
  code = code.replace(
    "const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);",
    `const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);

  useEffect(() => {
    if (activeTab?.url && activeTab.url.startsWith('http')) {
      const fetchReconInfo = async () => {
        try {
          const urlObj = new URL(activeTab.url!);
          const hostname = urlObj.hostname;
          setTargetInfo({ ip: 'Resolving...', server: 'Detecting...', xPoweredBy: 'Detecting...', securityHeaders: [], isLoading: true });
          
          let ip = 'Unknown';
          try {
            const dnsResponse = await fetch(\`https://dns.google/resolve?name=\${hostname}&type=A\`);
            const dnsData = await dnsResponse.json();
            ip = dnsData.Answer?.find((a: any) => a.type === 1)?.data || 'Unknown IP';
          } catch(e) {}
          
          let server = 'Unknown';
          let xPoweredBy = 'Hidden';
          let securityHeaders: string[] = [];
          
          try {
            const headResponse = await fetch(activeTab.url!, { method: 'HEAD', cache: 'no-cache' });
            server = headResponse.headers.get('server') || 'Hidden';
            xPoweredBy = headResponse.headers.get('x-powered-by') || 'Hidden';
            
            const secHeadersList = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options'];
            secHeadersList.forEach(h => {
              if (headResponse.headers.has(h)) securityHeaders.push(h);
            });
          } catch (e) {
            server = 'Protected / CORS Blocked';
          }
          
          setTargetInfo({ ip, server, xPoweredBy, securityHeaders, isLoading: false });
        } catch(e) {
          console.error(e);
        }
      };
      
      fetchReconInfo();
    } else {
      setTargetInfo(null);
    }
  }, [activeTab?.url]);`
  );
}

const reconUI = `
      {/* Live Target Reconnaissance */}
      {targetInfo && activeTab?.url && (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg mb-4 animate-in fade-in duration-500">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider">Live Target Profiling</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start space-x-2">
              <Network className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Resolved IP Address</p>
                <p className="text-[10px] text-zinc-200 font-mono font-medium">
                  {targetInfo.isLoading ? <span className="animate-pulse">resolving...</span> : targetInfo.ip}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Server className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Server Identity</p>
                <p className="text-[10px] text-zinc-200 font-mono font-medium truncate">
                  {targetInfo.isLoading ? <span className="animate-pulse">probing...</span> : targetInfo.server}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 col-span-2">
              <Cpu className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Security Posture</p>
                <div className="flex flex-wrap gap-1">
                  {targetInfo.xPoweredBy !== 'Hidden' && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                      {targetInfo.xPoweredBy}
                    </span>
                  )}
                  {targetInfo.securityHeaders.map(h => (
                    <span key={h} className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                      {h}
                    </span>
                  ))}
                  {!targetInfo.isLoading && targetInfo.xPoweredBy === 'Hidden' && targetInfo.securityHeaders.length === 0 && (
                    <span className="text-[8px] text-zinc-500 font-mono italic">No revealing headers</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('Live Target Reconnaissance')) {
  code = code.replace(
    '<div className="grid grid-cols-4 gap-2">',
    reconUI + '\n      <div className="grid grid-cols-4 gap-2">'
  );
}

fs.writeFileSync('src/components/DashboardOverview.tsx', code);
