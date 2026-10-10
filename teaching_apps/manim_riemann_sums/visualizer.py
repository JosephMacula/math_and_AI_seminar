from manim import *

class CalcOne(Scene):
    def construct(self):
    
        ax = Axes(x_range=[-2,6],
            y_range=[-2,1.2],
            tips = False,
            axis_config={"include_numbers":True}
            )
        graph = ax.plot(lambda x: np.sin(x), x_range=[0,PI], color=BLUE)
        self.play(Create(ax), Create(graph))
        self.wait(4)  

            
        def _riemann_sum(num_rects):
            rect_width = PI/num_rects
            return ax.get_riemann_rectangles(graph, 
                                            x_range = [0, PI], 
                                            dx = rect_width, 
                                            color = GREEN, 
                                            input_sample_type='center',
                                            stroke_width = max(0.1, 2*rect_width),
                                            fill_opacity = 0.8
                                            )
            
        
        n_values = [5,10,25,50,100]
        for i in range(len(n_values)-1):
            self.play(ReplacementTransform(_riemann_sum(n_values[i]),_riemann_sum(n_values[i+1])))
            self.wait(.5)


        




            


        