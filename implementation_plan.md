# Plan d'implémentation : Option "Appliquer à toutes les catégories" pour la numérotation

## 1. Contexte & Objectif
Actuellement, lorsque le Secrétariat attribue des numéros aux fiches depuis une catégorie spécifique (ex: "SUPPLÉMENTAIRE"), l'attribution manuelle et automatique a un comportement ambigu : l'état initial prend en compte la catégorie, mais la boucle de rendu et la soumission pouvaient déborder ou être limitées.

L'objectif est d'offrir une flexibilité totale :
- Par défaut, la numérotation automatique (et l'affichage manuel) ne s'appliquera **qu'à la catégorie en cours**.
- Si le système détecte qu'il y a des fiches "En attente" dans **d'autres catégories**, une case à cocher (ou bouton) "Appliquer à toutes les catégories" apparaîtra.
- Si le Secrétariat l'active, la numérotation s'étendra alors de manière continue sur **toutes les fiches en attente du mois**, quelle que soit leur catégorie.

## 2. Modifications prévues

### `ReclamationsView.jsx`
1. **Création d'un nouvel état local :**
   ```javascript
   const [applyToAllCategories, setApplyToAllCategories] = useState(false);
   ```

2. **Mise à jour du bouton "Attribuer N° & Transmettre" :**
   Lors du clic, réinitialiser `applyToAllCategories` à `false` pour que par défaut, seule la catégorie actuelle soit traitée. L'initialisation de `manualNumbers` se fera sur `published.filter(r => r.statut === 'En attente')`.

3. **Mise à jour de la Modale de Numérotation (`showNumberingModal`) :**
   - Calculer `allPending` (toutes catégories) et `currentCategoryPending` (catégorie actuelle).
   - Déterminer `hasOtherCategories = allPending.length > currentCategoryPending.length`.
   - Si `hasOtherCategories` est vrai, afficher un bouton toggle / case à cocher : *"Appliquer à toutes les catégories ({allPending.length} fiches au total)"*.
   - Modifier le rendu de la liste de saisie manuelle pour utiliser `listToNumber` (qui dépend de `applyToAllCategories`).

4. **Mise à jour de `handleAssignNumbersAndForward` :**
   Adapter la variable `toNumber` (liste des fiches à mettre à jour) :
   - Si `applyToAllCategories` est vrai : utiliser toutes les fiches en attente du mois.
   - Sinon : utiliser uniquement les fiches en attente de la catégorie actuelle (`currentView`).

## 3. Demande d'approbation
Merci de valider ce plan. Dès que vous me donnerez le feu vert, je procéderai aux modifications dans le fichier `ReclamationsView.jsx`.
