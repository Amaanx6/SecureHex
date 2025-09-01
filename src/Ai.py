1. Write a Program to Implement Breadth First Search
Description:
Breadth First Search (BFS) is an algorithm for traversing or searching graph data structures. It starts at the selected node (called the ‘source’) and explores all its neighboring nodes before moving on to their neighbors. BFS uses a queue data structure to keep track of nodes to visit next. It is particularly useful in finding the shortest path in an unweighted graph.
Code:
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])

    while queue:
        node = queue.popleft()
        if node not in visited:
            print(node, end=" ")
            visited.add(node)
            queue.extend(neighbor for neighbor in graph[node] if neighbor not in visited)

# Example graph
graph = {
    'A': ['B', 'C'],
    'B': ['D', 'E'],
    'C': ['F'],
    'D': [],
    'E': ['F'],
    'F': []
}

print("BFS traversal:")
bfs(graph, 'A')
 OUTPUT:
BFS traversal:
A B C D E F







2. Write a Program to Implement Depth First Search
Description:
Depth First Search (DFS) is an algorithm for traversing or searching graph data structures. It starts at the root (or any selected node) and explores as far as possible along each branch before backtracking. DFS uses a stack (or recursive function call stack) to remember the path.
Code:
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()

    if start not in visited:
        print(start, end=" ")
        visited.add(start)
        for neighbor in graph[start]:
            dfs(graph, neighbor, visited)

# Example graph
graph = {
    'A': ['B', 'C'],
    'B': ['D', 'E'],
    'C': ['F'],
    'D': [],
    'E': ['F'],
    'F': []
}

print("DFS traversal:")
dfs(graph, 'A')
 OUTPUT:
DFS traversal:
A B D E F C

