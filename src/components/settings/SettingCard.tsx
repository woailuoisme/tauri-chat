import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CardTone = "default" | "primary" | "danger";

const CARD_TONES: Record<CardTone, string> = {
  default: "border-border/60 bg-muted/20",
  primary: "border-primary/40 bg-primary/5",
  danger: "border-destructive/30 bg-destructive/5",
};

interface SettingCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** 卡片底部的补充说明 */
  footnote?: React.ReactNode;
  tone?: CardTone;
  className?: string;
}

/** 统一的设置卡片容器：消除各面板里重复的边框/间距组合 */
export function SettingCard({
  title,
  description,
  children,
  footnote,
  tone = "default",
  className,
}: SettingCardProps) {
  return (
    <section className={cn("rounded-xl border p-4", CARD_TONES[tone], className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title ? <h3 className="text-foreground text-xs font-semibold">{title}</h3> : null}
          {description ? (
            <p className="text-muted-foreground text-[11px] leading-relaxed">{description}</p>
          ) : null}
        </div>
      )}

      {children ? <div className={cn(title || description ? "mt-3" : "")}>{children}</div> : null}

      {footnote ? (
        <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">{footnote}</p>
      ) : null}
    </section>
  );
}

interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** 提供时渲染为可点击的 <label>，点击即可聚焦/切换右侧控件 */
  htmlFor?: string;
  children?: React.ReactNode;
  className?: string;
}

/** 一行设置：左侧文案、右侧控件 */
export function SettingRow({ label, description, htmlFor, children, className }: SettingRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-foreground text-xs font-medium">
            {label}
          </Label>
        ) : (
          <div className="text-foreground text-xs font-medium">{label}</div>
        )}
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
