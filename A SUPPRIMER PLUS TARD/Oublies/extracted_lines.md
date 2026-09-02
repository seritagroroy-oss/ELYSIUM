```javascript
530:           
531:         </div>
532:       </div>
533:     </div>
534:   );
535: }
536: 
537: function MutationDetailsModal({ selectedMutationDetails, onClose }) {
538:   if (!selectedMutationDetails) return null;
539:   const { original, mutated } = selectedMutationDetails.details;
540:   const agentName = selectedMutationDetails.agent?.name || 'Agent';
541: 
542:   const originalDays = original.worked_days !== undefined ? original.worked_days : (original.active_days||0);
543:   const mutatedDays = mutated.worked_days !== undefined ? mutated.worked_days : (mutated.active_days||0);
544:   const totalDays = originalDays + mutatedDays;
545:   const totalSalary = (original.base_prorata || 0) + (mutated.base_prorata || 0);
546: 
547:   const renderDaysInfo = (details, badgeColor = '#38bdf8') => {
548:     const active = details.active_days ?? 0;
549:     const worked = details.worked_days !== undefined ? details.worked_days : active;
550:     const baseFull = details.base_full || (details.base_prorata ? Math.round((details.base_prorata / (active || 1)) * 30) : 0);
551:     
552:     const hasDeductions = details.worked_days !== undefined && (
553:       (details.absences || 0) > 0 || 
554:       (details.map_count || 0) > 0 || 
555:       (details.permission_count || 0) > 0 || 
556:       (details.entrant_sortant_count || 0) > 0
557:     );
558: 
559:     return (
560:       <div style={{ textAlign: 'right' }}>
561:         <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px' }}>
562:           {(details.base_prorata || 0).toLocaleString('fr-FR')}
563:           <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>XOF</span>
564:         </div>
565: 
566:         {/* Formule de calcul explicite */}
567:         <div style={{
568:           marginTop: '6px',
569:           fontSize: '0.76rem',
570:           color: '#cbd5e1',
571:           background: 'rgba(15, 23, 42, 0.6)',
572:           padding: '4px 10px',
573:           borderRadius: '10px',
574:           border: '1px solid rgba(255, 255, 255, 0.08)',
575:           display: 'inline-flex',
576:           alignItems: 'center',
577:           gap: '5px'
578:         }}>
579:           <span style={{ color: badgeColor, fontWeight: '700' }}>🧮 Calcul :</span>
580:           <span>({baseFull.toLocaleString('fr-FR')} XOF ÷ 30 j) × {active} j = <strong style={{ color: '#ffffff' }}>{(details.base_prorata || 0).toLocaleString('fr-FR')} XOF</strong></span>
581:         </div>
582: 
583:         <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: '700', color: badgeColor, display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${badgeColor}15`, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${badgeColor}30` }}>
584:           <Clock size={13} /> {worked} jour(s) de service réel
585:         </div>
586:         {hasDeductions ? (
587:           <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px', fontWeight: '500' }}>
588:             ({active} actif{active > 1 ? 's' : ''}
589:             {(details.absences || 0) > 0 && ` • ${details.absences} abs.`}
590:             {(details.map_count || 0) > 0 && ` • ${details.map_count} MAP`}
591:             {(details.permission_count || 0) > 0 && ` • ${details.permission_count} perm.`}
592:             {(details.entrant_sortant_count || 0) > 0 && ` • ${details.entrant_sortant_count} entr./sort.`}
593:             )
594:           </span>
595:         ) : (
596:           details.worked_days === undefined && (
597:             <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
598:               ({active} jour(s) actif(s))
599:             </span>
600:           )
601:         )}
602:       </div>
603:     );
604:   };
605: 
606:   return (
607:     <div 
608:       style={{ 
609:         position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
610:         background: 'rgba(7, 11, 22, 0.88)', 
611:         backdropFilter: 'blur(16px) saturate(180%)', 
612:         zIndex: 99999, 
613:         display: 'flex', alignItems: 'center', justifyContent: 'center', 
614:         padding: '24px' 
615:       }} 
616:       onClick={onClose}
617:     >
618:       <div 
619:         style={{ 
620:           background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', 
621:           padding: '36px', 
622:           borderRadius: '30px', 
623:           width: '860px', 
624:           maxWidth: '100%', 
625:           maxHeight: '94vh', 
626:           overflowY: 'auto', 
627:           border: '1px solid rgba(56, 189, 248, 0.25)', 
628:           boxShadow: '0 35px 80px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(56, 189, 248, 0.12)', 
629:           animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
630:           position: 'relative'
631:         }} 
632:         onClick={e => e.stopPropagation()}
633:       >
634:         {/* Bouton de fermeture ultra-stylisé */}
635:         <button 
636:           onClick={onClose}
637:           style={{
638:             position: 'absolute',
639:             top: '24px',
640:             right: '24px',
641:             background: 'rgba(255, 255, 255, 0.06)',
642:             border: '1px solid rgba(255, 255, 255, 0.12)',
643:             color: '#94a3b8',
644:             borderRadius: '50%',
645:             width: '38px',
646:             height: '38px',
647:             display: 'flex',
648:             alignItems: 'center',
649:             justify: 'center',
650:             cursor: 'pointer',
651:             transition: 'all 0.2s ease'
652:           }}
653:           onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
654:           onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
655:           title="Fermer"
656:         >
657:           <X size={18} />
658:         </button>
659: 
660:         {/* En-tête Premium */}
661:         <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
662:           <div style={{ 
663:             background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)', 
664:             border: '1px solid rgba(56, 189, 248, 0.4)',
665:             padding: '16px', 
666:             borderRadius: '20px', 
667:             color: '#38bdf8',
668:             boxShadow: '0 8px 25px rgba(56, 189, 248, 0.25)',
669:             display: 'flex', alignItems: 'center', justifyContent: 'center'
670:           }}>
671:             <ArrowLeftRight size={28} />
672:           </div>
673:           <div>
674:             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
675:               <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 900, letterSpacing: '-0.02em' }}>
676:                 Détail de Mutation
677:               </h3>
678:               <span style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
679:                 Période Active
680:               </span>
681:             </div>
682:             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
683:               <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Agent concerné :</span>
684:               <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
685:                 �        {/* Workflow des deux cartes de mutation */}
686:         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
687:           
688:           {/* Card 1: Site d'Origine */}
689:           <div 
690:             style={{ 
691:               background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)', 
692:               border: '1px solid rgba(245, 158, 11, 0.35)', 
693:               borderRadius: '22px', 
694:               padding: '24px', 
695:               position: 'relative',
696:               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
697:               transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
698:               cursor: 'default'
699:             }}
700:             onMouseEnter={e => {
701:               e.currentTarget.style.transform = 'translateY(-4px) scale(1.008)';
702:               e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.7)';
703:               e.currentTarget.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.18), 0 0 25px rgba(245, 158, 11, 0.1)';
704:             }}
705:             onMouseLeave={e => {
706:               e.currentTarget.style.transform = 'translateY(0) scale(1)';
707:               e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
708:               e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
709:             }}
710:           >
711:             <div style={{ 
712:               position: 'absolute', top: '-12px', left: '24px', 
713:               background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
714:               color: '#ffffff', 
715:               fontSize: '0.72rem', 
716:               padding: '3px 12px', 
717:               borderRadius: '12px', 
718:               fontWeight: 800, 
719:               textTransform: 'uppercase', 
720:               letterSpacing: '0.8px',
721:               boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
722:               display: 'flex', alignItems: 'center', gap: '5px'
723:             }}>
724:               <span>📍 SITE D'ORIGINE (PROVENANCE)</span>
725:             </div>
726:             
727:             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
728:               <div>
729:                 <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: '800' }}>
730:                   {original.site}
731:                 </h4>
732:                 {original.subsite && (
733:                   <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
734:                     Sous-site : <strong style={{ color: '#cbd5e1' }}>{original.subsite}</strong>
735:                   </p>
736:                 )}
737:                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
738:                   <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Fonction :</span>
739:                   <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
740:                     {original.function}
741:                   </span>
742:                 </div>
743:               </div>
744:               {renderDaysInfo(original, '#f59e0b')}
745:             </div>
746:           </div>
747: 
748:           {/* Connecteur de Mutation Visuel */}
749:           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-8px 0' }}>
750:             <div 
751:               style={{ 
752:                 background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.15))', 
753:                 border: '1px solid rgba(56, 189, 248, 0.3)', 
754:                 color: '#38bdf8', 
755:                 padding: '6px 18px', 
756:                 borderRadius: '20px', 
757:                 fontSize: '0.78rem', 
758:                 fontWeight: '800', 
759:                 display: 'flex', alignItems: 'center', gap: '8px',
760:                 letterSpacing: '0.5px',
761:                 boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
762:                 transition: 'all 0.3s ease',
763:                 cursor: 'default'
764:               }}
765:               onMouseEnter={e => {
766:                 e.currentTarget.style.transform = 'scale(1.05)';
767:                 e.currentTarget.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.4)';
768:               }}
769:               onMouseLeave={e => {
770:                 e.currentTarget.style.transform = 'scale(1)';
771:                 e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
772:               }}
773:             >
774:               <span>➔</span> MUTATION EFFECTUÉE EN COURS DE MOIS <span>➔</span>
775:             </div>
776:           </div>
777: 
778:           {/* Card 2: Site de Mutation */}
779:           <div 
780:             style={{ 
781:               background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(56, 189, 248, 0.04) 100%)', 
782:               border: '1px solid rgba(56, 189, 248, 0.4)', 
783:               borderRadius: '22px', 
784:               padding: '24px', 
785:               position: 'relative',
786:               boxShadow: '0 10px 30px rgba(6, 182, 212, 0.1)',
787:               transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
788:               cursor: 'default'
789:             }}
790:             onMouseEnter={e => {
791:               e.currentTarget.style.transform = 'translateY(-4px) scale(1.008)';
792:               e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.75)';
793:               e.currentTarget.style.boxShadow = '0 15px 35px rgba(6, 182, 212, 0.25), 0 0 25px rgba(56, 189, 248, 0.15)';
794:             }}
795:             onMouseLeave={e => {
796:               e.currentTarget.style.transform = 'translateY(0) scale(1)';
797:               e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
798:               e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.1)';
799:             }}
800:           >
801:             <div style={{ 
802:               position: 'absolute', top: '-12px', left: '24px', 
803:               background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', 
804:               color: '#ffffff', 
805:               fontSize: '0.72rem', 
806:               padding: '3px 12px', 
807:               borderRadius: '12px', 
808:               fontWeight: 800, 
809:               textTransform: 'uppercase', 
810:               letterSpacing: '0.8px',
811:               boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
812:               display: 'flex', alignItems: 'center', gap: '5px'
813:             }}>
814:               <span>✨ SITE DE DESTINATION (MUTATION)</span>
815:             </div>
816: 
817:             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
818:               <div>
819:                 <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: '800' }}>
820:                   {mutated.site}
821:                 </h4>
822:                 {mutated.subsite && (
823:                   <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
824:                     Sous-site : <strong style={{ color: '#cbd5e1' }}>{mutated.subsite}</strong>
825:                   </p>
826:                 )}
827:                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
828:                   <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Fonction :</span>
829:                   <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
830:                     {mutated.function}
831:                   </span>
832:                 </div>
833:               </div>
834:               {renderDaysInfo(mutated, '#38bdf8')}
835:             </div>
836:           </div>
837: 
838:           {/* Bilan Synthétique des Jours et du Salaire */}
839:           <div 
840:             style={{ 
841:               background: 'rgba(15, 23, 42, 0.75)', 
842:               padding: '20px 24px', 
843:               borderRadius: '22px', 
844:               border: '1px solid rgba(255, 255, 255, 0.1)', 
845:               display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
846:               alignItems: 'center',
847:               transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
848:             }}
849:             onMouseEnter={e => {
850:               e.currentTarget.style.transform = 'translateY(-3px)';
851:               e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
852:               e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.15)';
853:             }}
854:             onMouseLeave={e => {
855:               e.currentTarget.style.transform = 'translateY(0)';
856:               e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
857:               e.currentTarget.style.boxShadow = 'none';
858:             }}
859:           >
860:             <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '20px' }}>
861:               <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
862:                 Cumul du service effectif
863:               </span>
864:               <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.25rem', marginTop: '4px', display: 'block' }}>
865:                 {totalDays} jour(s) travaillés
866:               </span>
867:               <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
868:                 <span style={{ color: '#f59e0b', fontWeight: '700' }}>🧮 Somme :</span>
869:                 <span>{originalDays} j ({original.site}) + {mutatedDays} j ({mutated.site}) = <strong style={{ color: '#ffffff' }}>{totalDays} j</strong></span>
870:               </div>
871:             </div>
872:             <div style={{ textAlign: 'right' }}>
873:               <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
874:                 Salaire de Base Brut Total
875:               </span>
876:               <span style={{ color: '#10b981', fontWeight 900, fontSize: '1.45rem', marginTop: '2px', display: 'block', textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
877:                 {totalSalary.toLocaleString('fr-FR')} <span style={{ fontSize: '0.85rem' }}>XOF</span>
878:               </span>
879:               <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
880:                 <span style={{ color: '#10b981', fontWeight: '700' }}>🧮 Somme :</span>
881:                 <span>{(original.base_prorata || 0).toLocaleString('fr-FR')} XOF + {(mutated.base_prorata || 0).toLocaleString('fr-FR')} XOF = <strong style={{ color: '#10b981' }}>{totalSalary.toLocaleString('fr-FR')} XOF</strong></span>
882:               </div>
883:             </div>
884:           </div>alary.toLocaleString('fr-FR')} XOF</strong></span>
885:               </div>
886:             </div>
887:           </div>
888: 
889:           {/* Note Comptable informative */}
890:           <div style={{ 
891:             padding: '18px 22px', 
892:             background: 'rgba(56, 189, 248, 0.04)', 
893:             border: '1px solid rgba(56, 189, 248, 0.2)', 
894:             borderRadius: '20px', 
895:             display: 'flex', gap: '16px', alignItems: 'flex-start' 
896:           }}>
897:             <div style={{ color: '#38bdf8', marginTop: '2px' }}>
898:               <AlertCircle size={22} />
899:             </div>
900:             <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6' }}>
901:               <strong style={{ color: '#38bdf8' }}>Note comptable (Règle forfaitaire des 30 jours) :</strong> Les jours actifs sur chaque site sont ajustés de manière proratisée pour respecter le forfait mensuel universel de 30 jours {original.calendar_active_days !== undefined && mutated.calendar_active_days !== undefined ? `(${original.calendar_active_days + mutated.calendar_active_days} jours calendaires réels équivalent à ${original.active_days + mutated.active_days} jours comptables)` : ''}, garantissant une paie exacte et conforme.
902:             </p>
903:           </div>
904:         </div>
905: 
906:         {/* Footer avec Bouton Fermer */}
907:         <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
908:           <button 
909:             onClick={onClose} 
910:             className="btn"
911:             style={{ 
912:               padding: '12px 32px', 
913:               fontSize: '0.95rem', 
914:               borderRadius: '14px', 
915:               background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
916:               color: 'white', 
917:               fontWeight: 800, 
918:               border: 'none',
919:               cursor: 'pointer',
920:               boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
921:               transition: 'all 0.2s ease'
922:             }}
923:             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(2, 132, 199, 0.6)'; }}
924:             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.4)'; }}
925:           >
926:             Fermer le détail
927:           </button>
928:         </div>
929:       </div>
930:     </div>
931:   );
932: }
933: 
934: function StatusChangeInfoModalComponent({ agent, onClose }) {
935:   if (!agent) return null;
936:   const scObj = typeof agent.status_change === 'string' ? JSON.parse(agent.status_change) : agent.status_change;
937:   return (
938:     <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(8px)' }}>
939:       <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '480px', width: '90%', border: '1px solid rgba(234,179,8,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
940:         <h3 style={{ margin: '0 0 1rem 0', color: '#facc15', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Détails Changement Statut</h3>
```
