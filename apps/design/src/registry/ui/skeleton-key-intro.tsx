"use client";

import { SkeletonKeyPreloader, useTokenColors } from "@empire/ui";

const metals = ["gold", "silver", "rose", "bronze"] as const;

/** A first-visit intro: the count runs up, a key turns in the dial and the page opens through the keyhole. */
export default function SkeletonKeyIntro({
  word = "crocwork",
  metal = "silver",
}: {
  word?: string;
  metal?: string;
}) {
  const c = useTokenColors(["--em-ink-50", "--em-ink-950"]);
  return (
    <div className="size-full min-h-[36rem] bg-background">
      {c && (
        <SkeletonKeyPreloader
          key={`${word}-${metal}`}
          loop
          word={word}
          name="crocwork.studio"
          tags={["#portfolio", "#design"]}
          greeting="welcome to"
          metal={metals.find((m) => m === metal) ?? "silver"}
          paper={c[0]}
          ink={c[1]}
          height="36rem"
        />
      )}
    </div>
  );
}
