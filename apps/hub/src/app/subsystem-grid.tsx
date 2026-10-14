import { Card, CardDescription, CardHeader, CardTitle } from "@empire/ui";
import { subsystems } from "@/lib/subsystems";

export function SubsystemGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subsystems.map((s, i) => (
        <li key={s.slug}>
          <Card className="h-full">
            <CardHeader>
              <p className="text-xs font-medium text-muted-foreground">
                ระบบย่อย {i + 1} · เร็ว ๆ นี้
              </p>
              <CardTitle>{s.name}</CardTitle>
              <CardDescription>{s.summary}</CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}
