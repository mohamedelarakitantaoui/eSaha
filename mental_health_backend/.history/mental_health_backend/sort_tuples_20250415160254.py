def sort_tuples_by_second_element(tuple_list):
    """
    Sort a list of tuples based on the second element of each tuple using lambda function.
    
    Args:
        tuple_list: A list of tuples where each tuple has at least two elements
        
    Returns:
        A sorted list of tuples based on their second element
    """
    # Using sorted() with a lambda function as the key
    # The lambda function extracts the second element (index 1) from each tuple
    sorted_list = sorted(tuple_list, key=lambda x: x[1])
    return sorted_list

# Example usage
l = [(1,2), (23,39), (4,5)]
result = sort_tuples_by_second_element(l)
print("Original list:", l)
print("Sorted list:", result)