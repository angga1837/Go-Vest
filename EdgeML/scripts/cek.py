import pandas as pd

df = pd.read_csv('data/CompleteDataSet.csv', header=[0, 1], low_memory=False)
print(df.shape)
print(df.columns.tolist()[:10])
print(df.head())