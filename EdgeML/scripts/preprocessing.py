import pandas as pd
import numpy as np

print("Loading CompleteDataSet.csv ...")
df = pd.read_csv('data/CompleteDataSet.csv', header=[0, 1], dtype=object)

new_cols = []
current_sensor = ""
for sensor, axis in df.columns:
    sensor_str = str(sensor).strip()
    if not sensor_str.startswith("Unnamed") and sensor_str != "nan" and sensor_str != "":
        current_sensor = sensor_str
    axis_str = str(axis).strip()
    new_cols.append(f"{current_sensor}__{axis_str}")
df.columns = new_cols

belt_acc_cols = [c for c in df.columns if 'BeltAccelerometer' in c and 'x-axis' in c] + \
                [c for c in df.columns if 'BeltAccelerometer' in c and 'y-axis' in c] + \
                [c for c in df.columns if 'BeltAccelerometer' in c and 'z-axis' in c]
belt_gyro_cols = [c for c in df.columns if 'BeltAngularVelocity' in c and 'x-axis' in c] + \
                 [c for c in df.columns if 'BeltAngularVelocity' in c and 'y-axis' in c] + \
                 [c for c in df.columns if 'BeltAngularVelocity' in c and 'z-axis' in c]
label_cols = [c for c in df.columns if c.startswith('Subject__') or c.startswith('Activity__') or
              c.startswith('Trial__') or c.startswith('Tag__')]

data = df[belt_acc_cols + belt_gyro_cols + label_cols].copy()
data.columns = ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'subject', 'activity', 'trial', 'tag']

for col in ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'subject', 'activity', 'trial']:
    data[col] = pd.to_numeric(data[col], errors='coerce')
data = data.dropna(subset=['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'subject', 'activity'])

SAMPLE_RATE_HZ = 18
WINDOW_SECONDS = 1
WINDOW_SIZE = SAMPLE_RATE_HZ * WINDOW_SECONDS
STEP_SIZE = WINDOW_SIZE // 2


def extract_features_from_window(window_df):
    ax, ay, az = window_df['ax'].values, window_df['ay'].values, window_df['az'].values
    gx, gy, gz = window_df['gx'].values, window_df['gy'].values, window_df['gz'].values

    magnitude_acc = np.sqrt(ax**2 + ay**2 + az**2)
    magnitude_gyro = np.sqrt(gx**2 + gy**2 + gz**2)

    jerk = np.diff(magnitude_acc) 
    jerk = np.append(jerk, jerk[-1]) if len(jerk) > 0 else np.array([0])

    tilt = np.degrees(np.arctan2(np.sqrt(ax**2 + ay**2), az))
    tilt_range = tilt.max() - tilt.min()  # seberapa besar perubahan tilt dalam window

    features = {
        'mean_ax': ax.mean(), 'mean_ay': ay.mean(), 'mean_az': az.mean(),
        'std_ax': ax.std(), 'std_ay': ay.std(), 'std_az': az.std(),
        'mean_magnitude': magnitude_acc.mean(),
        'std_magnitude': magnitude_acc.std(),
        'max_magnitude': magnitude_acc.max(),
        'min_magnitude': magnitude_acc.min(),
        'mean_gx': gx.mean(), 'mean_gy': gy.mean(), 'mean_gz': gz.mean(),
        'std_gx': gx.std(), 'std_gy': gy.std(), 'std_gz': gz.std(),
        'mean_gyro_magnitude': magnitude_gyro.mean(),
        'max_gyro_magnitude': magnitude_gyro.max(),
        # fitur baru:
        'max_jerk': np.abs(jerk).max(),
        'std_jerk': jerk.std(),
        'mean_tilt': tilt.mean(),
        'tilt_range': tilt_range,
    }
    return features


all_windows = []
grouped = data.groupby(['subject', 'activity', 'trial'])
print(f"Total sesi rekaman: {len(grouped)}")

for (subject, activity, trial), group in grouped:
    group = group.reset_index(drop=True)
    n_samples = len(group)
    for start in range(0, n_samples - WINDOW_SIZE + 1, STEP_SIZE):
        window = group.iloc[start:start + WINDOW_SIZE]
        feat = extract_features_from_window(window)
        feat['subject'] = subject
        feat['activity'] = activity
        feat['trial'] = trial
        feat['tag_majority'] = window['tag'].mode().iloc[0] if not window['tag'].isna().all() else np.nan
        all_windows.append(feat)

result_df = pd.DataFrame(all_windows)
result_df.to_csv('output/windowed_features_v2.csv', index=False)
print(f"Total window: {len(result_df)}")
print(f"Tersimpan ke output/windowed_features_v2.csv (22 fitur, termasuk jerk + tilt)")