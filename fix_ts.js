const fs = require('fs');

// Fix parseLocationData.ts
let pld = fs.readFileSync('src/lib/parseLocationData.ts', 'utf8');
pld = pld.replace(/export interface TopPlace \{/, 'export interface TopPlace {\n  name: string;');
pld = pld.replace(/frequency: number;/, 'frequency: number;\n  distance?: number;');
pld = pld.replace(/const hubs = \[\[23.7806/, 'const hubs: [number, number, string][] = [[23.7806');
fs.writeFileSync('src/lib/parseLocationData.ts', pld);

// Fix processData.ts
let pd = fs.readFileSync('src/lib/processData.ts', 'utf8');
pd = pd.replace(/b\.n - a\.n/g, 'b.visits - a.visits');
fs.writeFileSync('src/lib/processData.ts', pd);

// Fix MapView.tsx
let mv = fs.readFileSync('src/components/MapView.tsx', 'utf8');
mv = mv.replace(/onViewStateChange=\{[^}]+\}/, 'onViewStateChange={({ viewState }) => setViewState(viewState as any)}');
mv = mv.replace(/glOptions=\{[^}]+\}/, '{...({ glOptions: { preserveDrawingBuffer: true } } as any)}');
fs.writeFileSync('src/components/MapView.tsx', mv);
