"""Compare approximate user observations with Global client curves; no UI calibration.

Usage: python3 audit-crafting-observation.py CraftRecipe.json CraftRecipeRate.json
The observation is integer-level approximate, not evidence of six-decimal accuracy.
"""
import hashlib
import json
import sys
from pathlib import Path


OBSERVED = {0: 67, 10: 79, 11: 80, 14: 82, 17: 84, 22: 87}
for start, end, percent in [(12, 13, 81), (15, 16, 83), (18, 19, 85),
                            (20, 21, 86), (23, 25, 88), (26, 27, 89),
                            (28, 32, 90), (33, 34, 91), (35, 40, 92),
                            (41, 43, 93), (44, 65, 94)]:
    OBSERVED.update({gap: percent for gap in range(start, end + 1)})


def matches(rows):
    values = {}
    for row in rows:
        gap, rate = row['Gap'], row['Rate']
        if type(gap) is not int or not 0 <= gap <= 127 or gap in values:
            raise ValueError('Invalid or duplicate gap')
        if type(rate) is not int or not 0 <= rate <= 100_000_000:
            raise ValueError('Invalid rate')
        values[gap] = rate
    # A comparison hypothesis only: the user did not specify rounding behavior.
    return all(gap in values and values[gap] // 1_000_000 == percent
               for gap, percent in OBSERVED.items())


def audit(recipe_path, rate_path):
    recipes = json.loads(Path(recipe_path).read_text())['Properties']['Data']
    rates = json.loads(Path(rate_path).read_text())['Properties']['Data']
    names = [row['Name'] for row in rates]
    if len(names) != len(set(names)):
        raise ValueError('Duplicate rate group')
    matching = sorted(row['Name'] for row in rates if matches(row['Rates']))
    return {
        'observationDate': '2026-10-16',
        'reportedItemName': '건룡왕의활',
        'reportedRequirement': '세공 전문 Lv5 이상',
        'reportedCurrentMastery': '입문 Lv20',
        'observedPoints': {str(k): v for k, v in sorted(OBSERVED.items())},
        'comparison': 'floor(raw Rate / 1000000) equals approximate reported percent',
        'sourceHashes': {Path(p).name: hashlib.sha256(Path(p).read_bytes()).hexdigest()
                         for p in (recipe_path, rate_path)},
        'matchingGroups': matching,
        'matchingRecipes': [{'id': row['ID']['Value'], 'product': row['Product'],
                             'category': row['Category'], 'masteryLevel': row['MasteryLevel'],
                             'rateGroup': row['CraftRateGroup']}
                            for row in recipes if row['CraftRateGroup'] in matching],
        'limits': ['Approximate observation supports the proposed scale, not exact decimals.',
                   'Shared curves do not uniquely identify the reported item or faction.',
                   'Current mastery is not the proficiency gap; tier conversion is unverified.',
                   'No claim about live modifiers, negative gaps, caps, or unobserved recipes.'],
        'applicationSuccessRatesChanged': False,
    }


if __name__ == '__main__':
    print(json.dumps(audit(*sys.argv[1:]), ensure_ascii=False, indent=2))
