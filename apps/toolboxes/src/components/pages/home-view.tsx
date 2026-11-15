import { useState } from "react";
import { readLang, type Lang } from "@empire/core/lang";
import { TOOLBOXES_HOME } from "@empire/core/cms-pages";
import { CraftHome } from "@/components/home/craft-home";
import { useCmsContent } from "@/lib/cms";

/// หน้าแรก: แอปของ crocwork ตามเลย์เอาต์เทมเพลต CRAFTEVERYTHINGAPPS · หัวข้อ/คำโปรย/จุดเด่นแก้ใน CMS
export function HomeView() {
  const cms = useCmsContent(TOOLBOXES_HOME);
  const [lang] = useState<Lang>(() => readLang(document.cookie));

  return (
    <CraftHome
      lang={lang}
      title={cms.text("hero.title")}
      intro={cms.text("hero.intro")}
      perks={[cms.text("hero.perk1"), cms.text("hero.perk2"), cms.text("hero.perk3")]}
    />
  );
}
