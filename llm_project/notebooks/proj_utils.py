import torch


def diamond_net(X, gamma=4.0):
    W1 = torch.tensor([
        [ 1.0,  0.0],
        [-1.0,  0.0],
        [ 0.0,  1.0],
        [ 0.0, -1.0],
    ], dtype=X.dtype)
    b1 = torch.zeros(4, dtype=X.dtype)

    W2 = gamma * torch.tensor([
        [ 1.0,  1.0,  1.0,  1.0],
        [-1.0, -1.0, -1.0, -1.0],
    ], dtype=X.dtype)
    b2 = gamma * torch.tensor([-1.0, 1.0], dtype=X.dtype)

    a1 = X @ W1.T + b1
    h = torch.relu(a1)
    logits = h @ W2.T + b2

    shifted = logits - logits.max(dim=1, keepdim=True).values
    weights = shifted.exp()
    probs = weights / weights.sum(dim=1, keepdim=True)
    return a1, h, logits, probs