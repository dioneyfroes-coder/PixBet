import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Toggle } from '../../components/ui/toggle';
import { Button } from '../../components/ui/button';

type NotificationItem = {
  id: string;
  label?: string;
  description?: string;
};

type Props = {
  copy: {
    title?: string;
    description?: string;
    items?: NotificationItem[];
    actions?: Record<string, string>;
  };
  notifications: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  onSave?: () => void;
  onReset?: () => void;
};

export default function Notifications({ copy, notifications, onChange, onSave, onReset }: Props) {
  const items = copy.items ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">{copy.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item) => {
          return (
            <Toggle
              key={item.id}
              label={item.label}
              description={item.description}
              checked={Boolean(notifications[item.id])}
              onChange={(next: boolean) => onChange({ ...notifications, [item.id]: next })}
            />
          );
        })}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onReset}>
            {copy.actions?.reset ?? 'Redefinir'}
          </Button>
          <Button size="sm" onClick={onSave}>
            {copy.actions?.save ?? 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
