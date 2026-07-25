# Conversion regression document

This document covers inline math $E = mc^2$, structured content, and native Word equation export.[^method]

## Display equations

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

$$
A = \begin{pmatrix}
1 & 2 \\
3 & 4
\end{pmatrix}
$$

$$
\hat{x} + \bar{y} + \vec{z} = \widetilde{q}
$$

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0
\end{aligned}
$$

## Table

| Method | Accuracy |
| --- | ---: |
| Baseline | 0.82 |
| Proposed | 0.91 |

## Lists and code

1. First result
2. Second result

```python
def square(value):
    return value ** 2
```

## Citation-like content

The result follows from the standard identity [Smith, 2024].

![Regression figure](https://md2mathml.uuuu.site/supporters/andrae-vincent.png)

[^method]: This footnote must remain editable in Word.
