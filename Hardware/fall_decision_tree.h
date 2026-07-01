#ifndef FALL_DECISION_TREE_H
#define FALL_DECISION_TREE_H

struct FallFeatures {
  float mean_ax;
  float mean_ay;
  float mean_az;
  float std_ax;
  float std_ay;
  float std_az;
  float mean_magnitude;
  float std_magnitude;
  float max_magnitude;
  float min_magnitude;
  float mean_gx;
  float mean_gy;
  float mean_gz;
  float std_gx;
  float std_gy;
  float std_gz;
  float mean_gyro_magnitude;
  float max_gyro_magnitude;
  float max_jerk;
  float std_jerk;
  float mean_tilt;
  float tilt_range;
};


int predictFallDecisionTree(const FallFeatures& f) {
    if (f.min_magnitude <= 0.702483f) {
        if (f.std_ay <= 0.861023f) {
            if (f.mean_ay <= 0.588833f) {
                if (f.std_ay <= 0.751223f) {
                    if (f.max_gyro_magnitude <= 159.651955f) {
                        return 1;
                    } else {
                        return 1;
                    }
                } else {
                    if (f.mean_gyro_magnitude <= 94.297054f) {
                        return 0; 
                    } else {
                        return 1; 
                    }
                }
            } else {
                if (f.min_magnitude <= 0.565131f) {
                    if (f.mean_ax <= -0.525000f) {
                        return 0;
                    } else {
                        return 1; 
                    }
                } else {
                    if (f.mean_gz <= 4.959278f) {
                        return 0; 
                    } else {
                        return 0;
                    }
                }
            }
        } else {
            if (f.mean_tilt <= 88.803963f) {
                if (f.min_magnitude <= 0.137096f) {
                    return 0; 
                } else {
                    return 1; 
                }
            } else {
                if (f.mean_gx <= -45.709665f) {
                    if (f.mean_magnitude <= 1.337900f) {
                        return 1; 
                    } else {
                        return 0; 
                    }
                } else {
                    if (f.mean_gz <= 55.912973f) {
                        return 0;
                    } else {
                        return 0;
                    }
                }
            }
        }
    } else {
        if (f.tilt_range <= 38.463701f) {
            if (f.mean_magnitude <= 0.936794f) {
                if (f.max_magnitude <= 1.106946f) {
                    return 1; 
                } else {
                    return 0;
                }
            } else {
                if (f.max_magnitude <= 1.475118f) {
                    if (f.std_magnitude <= 0.031603f) {
                        return 0;
                    } else {
                        return 0;
                    }
                } else {
                    return 1; 
                }
            }
        } else {
            if (f.mean_ay <= 0.606083f) {
                if (f.std_magnitude <= 0.106989f) {
                    return 1; 
                } else {
                    return 1; 
                }
            } else {
                return 0;
            }
        }
    }
}

#endif
