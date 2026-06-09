import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, footer = null, children }) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="app-shell min-h-screen flex flex-col">
        <div className="flex items-center justify-center pt-12 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Roket Trading</span>
          </div>
        </div>

        <div className="flex-1 px-4 pb-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-5">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
