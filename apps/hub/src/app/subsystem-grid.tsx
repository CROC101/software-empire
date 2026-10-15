import { Card, CardDescription, CardHeader, CardTitle } from "@empire/ui";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

export function SubsystemGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subsystems.map((s, i) => {
        const url = appUrl(s.slug);
        return (
          <li key={s.slug}>
            <Card
              className={
                url
                  ? "relative h-full transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-primary"
                  : "h-full opacity-75"
              }
            >
              <CardHeader>
                <p className="text-xs font-medium text-muted-foreground">
                  ระบบย่อย {i + 1} · {url ? "เปิดใช้งาน" : "เร็ว ๆ นี้"}
                </p>
                <CardTitle>
                  {url ? (
                    // stretched link: the whole card is clickable, the accessible name stays the title
                    <a href={url} className="outline-none after:absolute after:inset-0">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </CardTitle>
                <CardDescription>{s.summary}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
