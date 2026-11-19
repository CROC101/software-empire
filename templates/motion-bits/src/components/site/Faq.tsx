"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ } from "@/data/site";

export default function Faq() {
  return (
    <Accordion className="gap-2">
      {FAQ.map((f) => (
        <AccordionItem key={f.q} value={f.q} className="rounded-xl bg-[#18151d] not-last:border-b-0">
          <AccordionTrigger className="items-center px-5 py-[17px] text-[15px] font-medium text-white/90 hover:no-underline **:data-[slot=accordion-trigger-icon]:text-white/50">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 text-[14px] leading-[1.6] text-white/55">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
