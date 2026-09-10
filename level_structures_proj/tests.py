import unittest

from server import compute, is_fundamental_discriminant, latex_polynomial

# server.py now runs the explicit CM construction on every request, which
# restricts the input to odd m <= MAX_M.  These are the cases that stay fast.
CASES = ((-23, 1), (-3, 3), (-4, 3), (-20, 3), (-7, 3), (-4, 5), (-11, 5), (-3, 7), (-4, 7))


def by_degree(result):
    return {n["degree_over_hilbert"]: n for n in result["lattice"]["nodes"]}


def subfield(result, node):
    return result["cyclotomic"]["nodes"][node["cyclotomic"]]


class DiscriminantTests(unittest.TestCase):
    def test_fundamental_discriminants(self):
        for D in (-3, -4, -7, -8, -11, -15, -20, -23):
            self.assertTrue(is_fundamental_discriminant(D))
        for D in (-1, -5, -12, -16, 5):
            self.assertFalse(is_fundamental_discriminant(D))


class LatticeTests(unittest.TestCase):
    def test_trivial_modulus(self):
        result = compute({"discriminant": -23, "modulus": 1})
        self.assertEqual(len(result["lattice"]["nodes"]), 1)
        node = result["lattice"]["nodes"][0]
        self.assertTrue(node["is_hilbert"] and node["is_ray"])

    def test_degrees_are_consistent(self):
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            degrees = result["degrees"]
            self.assertEqual(
                degrees["ray_over_K"],
                degrees["hilbert_over_K"] * degrees["ray_over_hilbert"],
            )
            for node in result["lattice"]["nodes"]:
                self.assertEqual(
                    node["degree_over_hilbert"] * node["degree_under_ray"],
                    degrees["ray_over_hilbert"],
                )

    def test_exactly_one_hilbert_ray_and_join(self):
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            for flag in ("is_hilbert", "is_ray", "is_cyclotomic_join"):
                self.assertEqual(
                    sum(1 for n in result["lattice"]["nodes"] if n[flag]), 1, (D, m, flag)
                )


class CyclotomicTests(unittest.TestCase):
    def test_ray_class_field_contains_all_of_Q_zeta_m(self):
        # K(zeta_m)/K is abelian of conductor dividing (m), so Q(zeta_m) < K_(m).
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            ray = next(n for n in result["lattice"]["nodes"] if n["is_ray"])
            self.assertEqual(
                subfield(result, ray)["degree"], result["cyclotomic"]["phi"], (D, m)
            )

    def test_intersection_grows_up_the_lattice(self):
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            nodes = result["lattice"]["nodes"]
            for lower, upper in result["lattice"]["edges"]:
                small = set(subfield(result, nodes[lower])["subgroup"])
                large = set(subfield(result, nodes[upper])["subgroup"])
                self.assertLessEqual(large, small, (D, m, lower, upper))

    def test_join_is_the_least_field_containing_the_roots_of_unity(self):
        result = compute({"discriminant": -4, "modulus": 7})
        join = next(n for n in result["lattice"]["nodes"] if n["is_cyclotomic_join"])
        self.assertEqual(join["degree_over_hilbert"], 6)
        self.assertEqual(subfield(result, join)["degree"], result["cyclotomic"]["phi"])
        self.assertEqual(subfield(result, join)["roots_of_unity"], 14)

    def test_hilbert_class_field_can_already_contain_roots_of_unity(self):
        # K = Q(sqrt -3) = Q(zeta_3) has class number one, so H_K = K already
        # contains the cube roots of unity.
        result = compute({"discriminant": -3, "modulus": 3})
        hilbert = next(n for n in result["lattice"]["nodes"] if n["is_hilbert"])
        found = subfield(result, hilbert)
        self.assertEqual(found["name"], "Q(z_3)")
        self.assertEqual(found["degree"], 2)
        self.assertEqual(found["roots_of_unity"], 6)

    def test_disc_4_modulus_7_table(self):
        result = compute({"discriminant": -4, "modulus": 7})
        nodes = by_degree(result)
        self.assertEqual(sorted(nodes), [1, 2, 3, 4, 6, 12])
        self.assertEqual(subfield(result, nodes[1])["name"], "Q")
        self.assertEqual(subfield(result, nodes[2])["name"], "Q(sqrt -7)")
        # The intersection can be a large real field while L holds no roots of
        # unity beyond +-1: these are different invariants.
        self.assertEqual(subfield(result, nodes[3])["name"], "Q(z_7)+")
        self.assertEqual(subfield(result, nodes[3])["degree"], 3)
        self.assertEqual(subfield(result, nodes[3])["roots_of_unity"], 2)
        self.assertEqual(subfield(result, nodes[6])["roots_of_unity"], 14)
        self.assertTrue(nodes[6]["is_cyclotomic_join"])

    def test_subfield_count_matches_cyclic_group_theory(self):
        # (Z/7)^x is cyclic of order 6, so Q(zeta_7) has one subfield per divisor.
        result = compute({"discriminant": -4, "modulus": 7})
        self.assertEqual(len(result["cyclotomic"]["nodes"]), 4)


class LatexTests(unittest.TestCase):
    def test_latex_labels(self):
        result = compute({"discriminant": -4, "modulus": 7})
        self.assertEqual(result["field"]["latex"], r"\mathbb{Q}(\sqrt{-1})")
        nodes = by_degree(result)
        self.assertEqual(subfield(result, nodes[2])["latex"], r"\mathbb{Q}(\sqrt{-7})")
        self.assertEqual(subfield(result, nodes[3])["latex"], r"\mathbb{Q}(\zeta_{7})^{+}")
        self.assertEqual(
            subfield(result, nodes[3])["polynomial_latex"], "x^{3} - x^{2} - 2 x + 1"
        )

    def test_every_subfield_carries_labels(self):
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            for node in result["cyclotomic"]["nodes"]:
                for key in ("latex", "latex_short", "polynomial_latex"):
                    self.assertTrue(node[key], (D, m, key))

    def test_latex_polynomial_conversion(self):
        self.assertEqual(latex_polynomial("x^12 - x + 2"), "x^{12} - x + 2")
        self.assertEqual(latex_polynomial("3*x^2"), "3 x^{2}")
        self.assertEqual(latex_polynomial("x^3 + 39/2*y*x"), r"x^{3} + \frac{39}{2} y x")


class ConstructionTests(unittest.TestCase):
    def test_cm_construction_degree_matches_class_field_theory(self):
        # The splitting field of the Weber-transformed m-division polynomial
        # should be the ray class field, of absolute degree 2 * |Cl_(m)|.
        for D, m in CASES:
            result = compute({"discriminant": D, "modulus": m})
            construction = result["construction"]
            self.assertEqual(
                construction["ray_field_absolute_degree"],
                2 * result["ray_class_group"]["order"],
                (D, m),
            )
            self.assertTrue(construction["degree_matches_class_field_theory"], (D, m))


class GuardTests(unittest.TestCase):
    def test_rejects_invalid_input(self):
        with self.assertRaisesRegex(ValueError, "fundamental"):
            compute({"discriminant": -5, "modulus": 3})
        with self.assertRaisesRegex(ValueError, "positive"):
            compute({"discriminant": -20, "modulus": 0})
        with self.assertRaisesRegex(ValueError, "integers"):
            compute({"discriminant": "-20", "modulus": 3})

    def test_rejects_input_outside_the_construction_range(self):
        with self.assertRaisesRegex(ValueError, "odd"):
            compute({"discriminant": -20, "modulus": 8})
        with self.assertRaisesRegex(ValueError, "m <="):
            compute({"discriminant": -4, "modulus": 13})
        with self.assertRaisesRegex(ValueError, "D_K"):
            compute({"discriminant": -1003, "modulus": 3})


if __name__ == "__main__":
    unittest.main()
