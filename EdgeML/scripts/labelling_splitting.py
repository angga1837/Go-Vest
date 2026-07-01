import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

df = pd.read_csv('output/windowed_features_v2.csv')

print("Distribusi Activity ID:")
print(df['activity'].value_counts().sort_index())

print("\nDistribusi Tag (kalau ada, biasanya 0=ADL/non-impact, lainnya=fall-related):")
print(df['tag_majority'].value_counts())

FALL_TAG_VALUES = [1, 2, 3, 4, 5]

df['label'] = df['tag_majority'].apply(lambda x: 1 if x in FALL_TAG_VALUES else 0)

print("\nDistribusi label final (1=Fall, 0=ADL):")
print(df['label'].value_counts())
print(f"Rasio fall : non-fall = {df['label'].mean():.2%} fall")

unique_subjects = df['subject'].unique()
print(f"Total subjek unik: {len(unique_subjects)}")

train_subjects, test_subjects = train_test_split(
    unique_subjects, test_size=0.2, random_state=42
)

train_df = df[df['subject'].isin(train_subjects)].reset_index(drop=True)
test_df = df[df['subject'].isin(test_subjects)].reset_index(drop=True)

print(f"Train: {len(train_df)} window dari {len(train_subjects)} subjek")
print(f"Test: {len(test_df)} window dari {len(test_subjects)} subjek")
print(f"Distribusi label train: {train_df['label'].value_counts().to_dict()}")
print(f"Distribusi label test: {test_df['label'].value_counts().to_dict()}")

train_df.to_csv('output/train.csv', index=False)
test_df.to_csv('output/test.csv', index=False)
print("Tersimpan ke output/train.csv dan output/test.csv")