"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { UsageEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function groupByDay(events: UsageEvent[]) {
  const days = new Map<string, { day: string; requests: number; value: number; compute: number }>();

  for (const event of events) {
    const day = new Date(event.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" });
    const current = days.get(day) || { day, requests: 0, value: 0, compute: 0 };
    current.requests += event.requests;
    current.value += event.value;
    current.compute += event.computeHours;
    days.set(day, current);
  }

  return Array.from(days.values());
}

export function UsageAreaChart({ events }: { events: UsageEvent[] }) {
  const data = groupByDay(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage pulse</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="requests" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#333" strokeDasharray="4 4" />
            <XAxis dataKey="day" stroke="#777" tick={{ fill: "#aaa", fontSize: 11 }} />
            <YAxis stroke="#777" tick={{ fill: "#aaa", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#050505", border: "2px solid #fff", borderRadius: 0, color: "#fff" }} />
            <Area dataKey="requests" fill="url(#requests)" stroke="#fff" strokeWidth={2} type="stepAfter" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EarningsBarChart({ events }: { events: UsageEvent[] }) {
  const data = groupByDay(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Value meter</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#333" strokeDasharray="4 4" />
            <XAxis dataKey="day" stroke="#777" tick={{ fill: "#aaa", fontSize: 11 }} />
            <YAxis stroke="#777" tick={{ fill: "#aaa", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#050505", border: "2px solid #fff", borderRadius: 0, color: "#fff" }} />
            <Bar dataKey="value" fill="#f8f8f2" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
