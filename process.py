import json

import pandas as pd


type_mapping = {'A': 'Meaning', 'B': 'Example', 'C': 'Comparison'}


def process():
    def extract_node(row):
        data['nodes'].append({
            'id': row['ID'],
            'type': type_mapping[row['Type']],
            'category': row['Category'],
            'count': row['Count'],
            'code': row['Code']
        })

    def extract_link(row):
        for _ in range(2):
            _ += 1
            relation = f'Relation {_}'
            if not pd.isna(row[relation]):
                data['links'].append({
                    'source': row['ID'],
                    'target': int(row[f'ID {_}']),
                    'relation': row[relation].split()[0]
                })

    code = pd.read_csv('coding.csv')
    data = {'nodes': [], 'links': []}
    code.apply(extract_node, axis=1)
    code.apply(extract_link, axis=1)
    with open('view/coding.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, indent=2))


if __name__ == '__main__':
    process()
