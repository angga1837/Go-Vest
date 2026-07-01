import joblib
import numpy as np

FEATURE_COLS = [
    'mean_ax', 'mean_ay', 'mean_az', 'std_ax', 'std_ay', 'std_az',
    'mean_magnitude', 'std_magnitude', 'max_magnitude', 'min_magnitude',
    'mean_gx', 'mean_gy', 'mean_gz', 'std_gx', 'std_gy', 'std_gz',
    'mean_gyro_magnitude', 'max_gyro_magnitude',
    'max_jerk', 'std_jerk', 'mean_tilt', 'tilt_range',
]

FEATURE_TO_C_VAR = {
    'mean_ax': 'f.mean_ax', 'mean_ay': 'f.mean_ay', 'mean_az': 'f.mean_az',
    'std_ax': 'f.std_ax', 'std_ay': 'f.std_ay', 'std_az': 'f.std_az',
    'mean_magnitude': 'f.mean_magnitude', 'std_magnitude': 'f.std_magnitude',
    'max_magnitude': 'f.max_magnitude', 'min_magnitude': 'f.min_magnitude',
    'mean_gx': 'f.mean_gx', 'mean_gy': 'f.mean_gy', 'mean_gz': 'f.mean_gz',
    'std_gx': 'f.std_gx', 'std_gy': 'f.std_gy', 'std_gz': 'f.std_gz',
    'mean_gyro_magnitude': 'f.mean_gyro_magnitude', 'max_gyro_magnitude': 'f.max_gyro_magnitude',
    'max_jerk': 'f.max_jerk', 'std_jerk': 'f.std_jerk',
    'mean_tilt': 'f.mean_tilt', 'tilt_range': 'f.tilt_range',
}


def tree_to_c_code(tree, feature_names, class_names=('ADL', 'FALL')):
    tree_ = tree.tree_
    feature_name = [
        feature_names[i] if i != -2 else "undefined!"
        for i in tree_.feature
    ]

    lines = []

    def recurse(node, depth):
        indent = "    " * depth
        if tree_.feature[node] != -2: 
            name = feature_name[node]
            c_var = FEATURE_TO_C_VAR[name]
            threshold = tree_.threshold[node]
            lines.append(f"{indent}if ({c_var} <= {threshold:.6f}f) {{")
            recurse(tree_.children_left[node], depth + 1)
            lines.append(f"{indent}}} else {{")
            recurse(tree_.children_right[node], depth + 1)
            lines.append(f"{indent}}}")
        else: 
            value = tree_.value[node][0]
            predicted_class = int(np.argmax(value))
            confidence = value[predicted_class] / value.sum()
            lines.append(f"{indent}return {predicted_class}; // {class_names[predicted_class]}, confidence~{confidence:.2f}")

    recurse(0, 1)
    return "\n".join(lines)


def generate_full_c_function(tree, feature_names):
    body = tree_to_c_code(tree, feature_names)

    c_code = f""" int predictFallDecisionTree(const FallFeatures& f) {{
                    {body}
                }}
            """
    return c_code


if __name__ == "__main__":
    clf = joblib.load('output/decision_tree_fall_model.joblib')
    c_code = generate_full_c_function(clf, FEATURE_COLS)

    with open('output/fall_decision_tree.h', 'w') as f:
        f.write("#ifndef FALL_DECISION_TREE_H\n#define FALL_DECISION_TREE_H\n\n")
        f.write("struct FallFeatures {\n")
        for feat in FEATURE_COLS:
            f.write(f"  float {feat};\n")
        f.write("};\n\n")
        f.write(c_code)
        f.write("\n#endif\n")

    print("Kode C tersimpan ke output/fall_decision_tree.h")
    print(f"Jumlah baris kode if-else: {len(c_code.splitlines())}")
    print("\nPreview 20 baris pertama:")
    print("\n".join(c_code.splitlines()[:20]))
