import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Clock, Target, Flame, Award, TrendingUp, Calendar, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const MASTERY_DATA = [
  { day: 'Mon', level: 20, practice: 1.5 },
  { day: 'Tue', level: 25, practice: 2.0 },
  { day: 'Wed', level: 22, practice: 1.0 },
  { day: 'Thu', level: 30, practice: 3.0 },
  { day: 'Fri', level: 35, practice: 2.5 },
  { day: 'Sat', level: 45, practice: 4.0 },
  { day: 'Sun', level: 50, practice: 3.5 },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-12 max-w-[1600px] mx-auto pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<Clock className="w-6 h-6" />} 
          label="Practice Time" 
          value="17.5h" 
          subValue="+2.4h this week" 
          color="neon-orange"
        />
        <StatCard 
          icon={<Target className="w-6 h-6" />} 
          label="Mastery Level" 
          value="Level 12" 
          subValue="Intermediate" 
          color="neon-blue"
        />
        <StatCard 
          icon={<Flame className="w-6 h-6" />} 
          label="Daily Streak" 
          value="14 Days" 
          subValue="Personal Best: 21" 
          color="neon-orange"
        />
        <StatCard 
          icon={<Award className="w-6 h-6" />} 
          label="Intel Saved" 
          value="42 Chords" 
          subValue="8 New this week" 
          color="neon-blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Mastery Curve */}
        <div className="lg:col-span-2 glass-panel p-10 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl relative overflow-hidden premium-shadow">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-orange/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-12 relative z-10">
            <div>
              <h4 className="text-3xl lg:text-4xl font-bold tracking-tight text-white neon-text-glow">Mastery Curve</h4>
              <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mt-2">Skill progression over time</p>
            </div>
            <div className="flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
              <button className="px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Week</button>
              <button className="px-6 py-2 rounded-xl bg-neon-orange text-[11px] font-bold uppercase tracking-widest text-black shadow-lg shadow-neon-orange/20">Month</button>
            </div>
          </div>
          
          <div className="h-80 lg:h-96 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MASTERY_DATA}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6321" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff20', fontSize: 11, fontWeight: 'bold' }} 
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
                  itemStyle={{ color: '#FF6321', fontSize: '14px', fontWeight: 'bold' }}
                  cursor={{ stroke: '#ffffff10', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#FF6321" 
                  fillOpacity={1} 
                  fill="url(#colorLevel)" 
                  strokeWidth={5}
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-10 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl relative overflow-hidden premium-shadow">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none" />
          
          <h4 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-12 relative z-10 neon-text-glow">Recent Activity</h4>
          <div className="space-y-10 relative z-10">
            <ActivityItem 
              icon={<Music className="w-5 h-5" />} 
              title="Analyzed 'Sultans of Swing'" 
              time="2 hours ago"
            />
            <ActivityItem 
              icon={<TrendingUp className="w-5 h-5" />} 
              title="Reached Level 12 Mastery" 
              time="Yesterday"
            />
            <ActivityItem 
              icon={<Calendar className="w-5 h-5" />} 
              title="Completed 7-day streak" 
              time="2 days ago"
            />
            <ActivityItem 
              icon={<Target className="w-5 h-5" />} 
              title="Saved 3 Jazz Voicings" 
              time="3 days ago"
            />
          </div>
          
          <button className="w-full mt-16 py-5 glass-panel hover:border-white/20 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all rounded-2xl lg:rounded-3xl active:scale-[0.98] relative z-10 shadow-xl">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  subValue: string,
  color: 'neon-orange' | 'neon-blue'
}) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-panel p-8 rounded-[2rem] relative overflow-hidden group premium-shadow shadow-xl"
    >
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full -mr-16 -mt-16 transition-opacity opacity-20 group-hover:opacity-40",
        color === 'neon-orange' ? "bg-neon-orange" : "bg-neon-blue"
      )} />
      
      <div className={cn(
        "p-4 rounded-2xl mb-6 w-fit shadow-inner",
        color === 'neon-orange' ? "bg-neon-orange/10 text-neon-orange" : "bg-neon-blue/10 text-neon-blue"
      )}>
        {icon}
      </div>
      <p className="text-[11px] text-white/20 uppercase tracking-[0.2em] font-bold mb-2">{label}</p>
      <h3 className="text-4xl font-bold mb-2 text-white">{value}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{subValue}</p>
    </motion.div>
  );
}

function ActivityItem({ icon, title, time }: { icon: React.ReactNode, title: string, time: string }) {
  return (
    <div className="flex items-start gap-6 group cursor-default">
      <div className="p-3 rounded-xl bg-white/5 text-white/20 mt-1 transition-all group-hover:bg-white/10 group-hover:text-white shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-white/80 group-hover:text-white transition-colors leading-tight">{title}</p>
        <p className="text-[11px] text-white/20 uppercase tracking-[0.2em] font-bold mt-1">{time}</p>
      </div>
    </div>
  );
}
