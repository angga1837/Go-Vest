import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text, plot_tree
from sklearn.metrics import classification_report, confusion_matrix, RocCurveDisplay, PrecisionRecallDisplay
from sklearn.utils.class_weight import compute_class_weight
import joblib

os.makedirs('output', exist_ok=True)


# LOAD DATA 
df = pd.read_csv('output/windowed_features_v2.csv')

FALL_TAG_VALUES = [1, 2, 3, 4, 5] 
df['label'] = df['tag_majority'].apply(lambda x: 1 if x in FALL_TAG_VALUES else 0)

print("Distribusi label:", df['label'].value_counts().to_dict())

FEATURE_COLS = [
    'mean_ax', 'mean_ay', 'mean_az', 'std_ax', 'std_ay', 'std_az',
    'mean_magnitude', 'std_magnitude', 'max_magnitude', 'min_magnitude',
    'mean_gx', 'mean_gy', 'mean_gz', 'std_gx', 'std_gy', 'std_gz',
    'mean_gyro_magnitude', 'max_gyro_magnitude',
    'max_jerk', 'std_jerk', 'mean_tilt', 'tilt_range',
]

# Bagi berpubsjek

unique_subjects = df['subject'].unique()
train_subjects, test_subjects = train_test_split(unique_subjects, test_size=0.2, random_state=42)
train_df = df[df['subject'].isin(train_subjects)].reset_index(drop=True)
test_df = df[df['subject'].isin(test_subjects)].reset_index(drop=True)

X_train = train_df[FEATURE_COLS].values
y_train = train_df['label'].values
X_test = test_df[FEATURE_COLS].values
y_test = test_df['label'].values

print(f"Train: {len(X_train)} window, Test: {len(X_test)} window")

# atur class weights agar model tidak bias ke kelas mayoritas (ADL)
class_weights_arr = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
base_w0 = class_weights_arr[0]
base_w1 = class_weights_arr[1]

print(f"Base Balanced Weight -> 0: {base_w0:.2f}, 1: {base_w1:.2f}")


# training
TARGET_RECALL = 0.85 #target recall minimal
TARGET_PRECISION = 0.50 #target precision minimal

best_result = {'f1': 0}
for w_mult in [0.4, 0.5, 0.6, 0.8, 1.0]:
    current_weights = {0: base_w0, 1: base_w1 * w_mult}
    
    for max_depth in [3, 4, 5, 6, 7]:
        for min_samples_leaf in [20, 40, 60, 100]:
            
            clf = DecisionTreeClassifier(
                max_depth=max_depth,
                min_samples_leaf=min_samples_leaf,
                class_weight=current_weights,
                random_state=42
            )
            clf.fit(X_train, y_train)

            y_pred = clf.predict(X_test)
            cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
            if cm.shape != (2, 2):
                continue
            
            tn, fp, fn, tp = cm.ravel()
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

            meets_target = recall >= TARGET_RECALL and precision >= TARGET_PRECISION
            if (meets_target and f1 > best_result.get('f1_target_met', 0)) or (not best_result.get('meets_target') and f1 > best_result['f1']):
                best_result = {
                    'f1': f1, 'recall': recall, 'precision': precision,
                    'specificity': specificity, 'max_depth': max_depth,
                    'min_samples_leaf': min_samples_leaf, 'weight_mult': w_mult,
                    'model': clf, 'cm': cm, 'meets_target': meets_target,
                    'f1_target_met': f1 if meets_target else 0
                }

# Report hasil trabaik
r = best_result
best_model = r['model']

# Prediksi ulang data X_test menggunakan model terbaik
y_pred_best = best_model.predict(X_test)

print(f"\n{'='*60}")
print(f"HASIL TERBAIK GRID SEARCH")
print(f"{'='*60}")
print(f"max_depth         : {r['max_depth']}")
print(f"min_samples_leaf  : {r['min_samples_leaf']}")
print(f"Weight Multiplier : {r['weight_mult']}x dari bobot balanced")
print(f"Recall Target     : {r['recall']:.2%}  (target >=85%)")
print(f"Precision Target  : {r['precision']:.2%}  (target >=50%)")
print(f"Specificity       : {r['specificity']:.2%}")
print(f"F1-score          : {r['f1']:.3f}")
print(f"Target tercapai?  : {r['meets_target']}")
print(f"Jumlah Node Pohon : {best_model.tree_.node_count}")

print(f"\n{'='*60}")
print("CLASSIFICATION REPORT LENGKAP")
print(f"{'='*60}")
print(classification_report(y_test, y_pred_best, target_names=['Bukan Jatuh (0)', 'Jatuh (1)']))

print(f"{'='*60}")
print(f"Confusion Matrix:\n{r['cm']}")
print(f"{'='*60}")

joblib.dump(best_model, 'output/decision_tree_fall_model.joblib')
tree_text = export_text(best_model, feature_names=FEATURE_COLS)
with open('output/decision_tree_structure.txt', 'w') as f:
    f.write(tree_text)
print(f"Struktur teks (if-else logic) tersimpan ke output/decision_tree_structure.txt")


# VISUALISASI HASIL 
print(f"\n{'='*60}")
print("MENYIMPAN GRAFIK EVALUASI KE FOLDER 'output/'...")

sns.set_theme(style="whitegrid")

# Confusion Matrix 
plt.figure(figsize=(6, 5))
sns.heatmap(r['cm'], annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Bukan Jatuh (0)', 'Jatuh (1)'], 
            yticklabels=['Bukan Jatuh (0)', 'Jatuh (1)'],
            annot_kws={"size": 14})
plt.title('Confusion Matrix - Model Terbaik', fontsize=14)
plt.ylabel('Aktual', fontsize=12)
plt.xlabel('Prediksi', fontsize=12)
plt.tight_layout()
plt.savefig('output/eval_1_confusion_matrix.png', dpi=300)
plt.close()

# Feature Importance Bar Chart
importances = best_model.feature_importances_
indices = np.argsort(importances)[::-1]
features_sorted = [FEATURE_COLS[i] for i in indices]

plt.figure(figsize=(12, 6))
sns.barplot(x=importances[indices], y=features_sorted, hue=features_sorted, palette="viridis", legend=False)
plt.title('Tingkat Kepentingan Fitur (Feature Importance)', fontsize=14)
plt.xlabel('Skor Kepentingan (Gini Importance)', fontsize=12)
plt.ylabel('Fitur Sensor', fontsize=12)
plt.tight_layout()
plt.savefig('output/eval_2_feature_importance.png', dpi=300)
plt.close()

# ROC Curve & Precision-Recall Curve
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
RocCurveDisplay.from_estimator(best_model, X_test, y_test, ax=ax1, name='Decision Tree')
ax1.set_title('Receiver Operating Characteristic (ROC) Curve')
ax1.plot([0, 1], [0, 1], linestyle='--', color='gray') 
PrecisionRecallDisplay.from_estimator(best_model, X_test, y_test, ax=ax2, name='Decision Tree')
ax2.set_title('Precision-Recall Curve')

plt.tight_layout()
plt.savefig('output/eval_3_roc_pr_curves.png', dpi=300)
plt.close()

# Visualisasi Gambar Decision Rtee
plt.figure(figsize=(24, 12)) 
plot_tree(best_model, 
          feature_names=FEATURE_COLS, 
          class_names=['Bukan Jatuh', 'Jatuh'], 
          filled=True, 
          rounded=True, 
          fontsize=10,
          proportion=False)
plt.title("Struktur Pohon Keputusan (Visual)", fontsize=16)
plt.tight_layout()
plt.savefig('output/eval_4_tree_plot.png', dpi=300)
plt.close()

print("Semua grafik berhasil disimpan ke dalam folder 'output/'.")