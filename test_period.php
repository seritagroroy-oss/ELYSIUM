<?php
function getPeriodDates($period, $start_day, $end_day)
{
   $base = DateTime::createFromFormat('Y-m-d', $period . '-01');
   if (!$base) return [];

   $start = clone $base;
   $start->modify('-1 month');
   $start->setDate((int) $start->format('Y'), (int) $start->format('m'), (int) $start_day);

   $end = clone $base;
   $end->setDate((int) $end->format('Y'), (int) $end->format('m'), (int) $end_day);
   if ($end < $start) {
       $end->modify('+1 month');
   }

   $dates = [];
   $cursor = clone $start;
   while ($cursor <= $end) {
       $dates[] = $cursor->format('Y-m-d');
       $cursor->modify('+1 day');
       if (count($dates) > 62) break;
   }
   return $dates;
}
print_r(getPeriodDates('2026-06', 21, 20));
