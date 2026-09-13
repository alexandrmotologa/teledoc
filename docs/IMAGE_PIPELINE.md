# Image processing pipeline and mathematics

TeleDoc applies two primary algorithms to turn raw angled photos into crisp documents:
1. 4-point projective homography transformation with bilinear interpolation.
2. Bradley-Roth adaptive thresholding for shadow removal.

## 1. Projective homography transformation

When a rectangular document is photographed at an angle, the camera lens projects it as an arbitrary quadrilateral. A projective transformation (homography) maps coordinates from the camera plane $(x, y)$ to an upright rectangular destination plane $(u, v)$.

### Mathematical model

The relationship between source coordinates $(x, y)$ and destination coordinates $(u, v)$ is expressed in homogeneous coordinates as:

$$
\begin{bmatrix}
x' \\
y' \\
w'
\end{bmatrix}
=
\begin{bmatrix}
h_{00} & h_{01} & h_{02} \\
h_{10} & h_{11} & h_{12} \\
h_{20} & h_{21} & 1
\end{bmatrix}
\begin{bmatrix}
u \\
v \\
1
\end{bmatrix}
$$

where the Cartesian coordinates in the source image are:

$$x = \frac{x'}{w'} = \frac{h_{00}u + h_{01}v + h_{02}}{h_{20}u + h_{21}v + 1}$$
$$y = \frac{y'}{w'} = \frac{h_{10}u + h_{11}v + h_{12}}{h_{20}u + h_{21}v + 1}$$

### Solving the linear system

Given 4 pairs of corresponding points:
- Destination rectangle: $(0,0), (W, 0), (W, H), (0, H)$
- Source quadrilateral: $P_0, P_1, P_2, P_3$

We construct an $8 \times 8$ system of linear equations $A \mathbf{h} = \mathbf{b}$ and solve for the 8 unknowns $[h_{00}, h_{01}, h_{02}, h_{10}, h_{11}, h_{12}, h_{20}, h_{21}]^T$ using Gaussian elimination with partial pivoting.

### Backward mapping and bilinear interpolation

Direct forward mapping creates holes and artifacts in the destination canvas. TeleDoc iterates through every pixel $(u, v)$ of the target rectangle, maps backward to the continuous source coordinate $(x, y)$, and samples the 4 nearest neighbors using bilinear interpolation:

$$
I(x, y) = (1 - dx)(1 - dy) I(x_0, y_0) + dx(1 - dy) I(x_1, y_0) + (1 - dx)dy I(x_0, y_1) + dx \cdot dy I(x_1, y_1)
$$

where $x_0 = \lfloor x \rfloor$, $x_1 = x_0 + 1$, $dx = x - x_0$, and similarly for $y$.

## 2. Bradley-Roth adaptive thresholding ("Magic B&W")

Standard global thresholding (like Otsu) fails when a page has uneven lighting, shadows from the photographer's hand, or flash glare. Bradley and Roth (2007) solve this with an adaptive threshold based on the local mean over an $S \times S$ neighborhood.

### Algorithm steps

1. Convert the input image to grayscale luminance:
   $$Y(x, y) = 0.299R + 0.587G + 0.114B$$
2. Construct the 2D integral image $I_{int}$:
   $$I_{int}(x, y) = Y(x, y) + I_{int}(x-1, y) + I_{int}(x, y-1) - I_{int}(x-1, y-1)$$
3. Define the window radius $r = \lfloor S / 2 \rfloor$, typically setting $S = \text{width} / 8$.
4. For each pixel at $(x, y)$, calculate the local neighborhood sum in $O(1)$ time:
   $$\text{Sum} = I_{int}(x_2, y_2) - I_{int}(x_1 - 1, y_2) - I_{int}(x_2, y_1 - 1) + I_{int}(x_1 - 1, y_1 - 1)$$
   where $x_1 = \max(x - r, 0)$, $x_2 = \min(x + r, W - 1)$, and similarly for $y$.
5. Compute the local count $C = (x_2 - x_1 + 1)(y_2 - y_1 + 1)$.
6. Compare the pixel value against the threshold:
   $$\text{Pixel}(x, y) = \begin{cases} 0 & \text{if } Y(x, y) \cdot C \le \text{Sum} \cdot (1 - T/100) \\ 255 & \text{otherwise} \end{cases}$$
   where $T \approx 15$ percent.

This turns dark gray paper shadows into pure white while retaining dark ink characters.
