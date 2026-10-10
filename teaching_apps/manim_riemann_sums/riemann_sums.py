from manim import *

class RiemannSumAnimation(Scene):
    def __init__(self, func, a, b, **kwargs):
        super().__init__(**kwargs)
        self.func = func
        self.a = a
        self.b = b
        if not self.a < self.b:
            raise ValueError(f"a must be less than b, got a = {a}, b = {b}")

    
    def construct(self):
        ys = [self.func(x) for x in np.linspace(self.a, self.b, 200)]
        if not np.all(np.isfinite(ys)):
            raise ValueError(f'f is undefined or blows up somewhere on [{self.a}, {self.b}]')
        y_min = min(0, min(ys))     # always include 0: the rectangles start there
        y_max = max(0, max(ys))
        pad = 0.1 * (y_max - y_min) if y_max - y_min > 0 else 1 # 10% breathing room above and below
        y_span = (y_max + pad) - (y_min - pad)
        x_tick_step = (self.b - self.a)/10

        ax = Axes(x_range=[self.a, self.b, x_tick_step],
                y_range=[y_min - pad, y_max + pad, y_span/10],
                tips=False,
                x_axis_config={"include_numbers": True,"decimal_number_config": {"num_decimal_places": 1}}
        )
        ax.remove(ax.y_axis)       
        
        graph = ax.plot(self.func, x_range=[self.a,self.b], color=RED, stroke_width=6)
        graph.set_z_index(1)  # always draw the curve above rectangles and area
        self.play(Create(ax), Create(graph))
        self.wait(1) 

            
        def _riemann_sum(num_rects):
            rect_width = (self.b-self.a)/num_rects
            return ax.get_riemann_rectangles(graph, 
                                            x_range = [self.a, self.b], 
                                            dx = rect_width, 
                                            color = GREEN, 
                                            input_sample_type='center',
                                            stroke_width = 0.1,
                                            fill_opacity = 0.8
                                            )
            
        
        n_values = [5,10,25,50,100]
        rects = _riemann_sum(n_values[0])
        self.play(Create(rects))
        self.wait(.5)
        for n in n_values[1:]:
            new_rects = _riemann_sum(n)
            self.play(ReplacementTransform(rects, new_rects))
            rects = new_rects
            self.wait(.5)

        area = ax.get_area(graph, x_range=[self.a, self.b], opacity=1, color = GREEN)
        self.play(FadeIn(area))