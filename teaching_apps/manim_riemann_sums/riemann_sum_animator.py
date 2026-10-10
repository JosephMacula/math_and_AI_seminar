import numpy as np
from manim import *
from riemann_sums import RiemannSumAnimation

def riemann_sum_animator(func, a, b, vid_name):
    with tempconfig({'quality': 'low_quality', 'output_file': vid_name}):
        video = RiemannSumAnimation(func, a, b)
        video.render()